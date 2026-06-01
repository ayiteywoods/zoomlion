import { NextResponse } from "next/server";
import { resolveSipEmail } from "@/lib/auth-credentials";
import { createSipGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { buildSystemSessionErrorHtml } from "@/lib/system-session-bootstrap";
import {
  readSystemLaunchCredentials,
  redirectAfterFormPost,
} from "@/lib/system-session-request";
import { SIP_GATEWAY_ENTRY } from "@/lib/sip-web-auth";
import { SIP_SESSION_COOKIE } from "@/lib/system-session-store";

const sipConfig = getSystemLaunchConfig("sip");

function sipLaunchFailureResponse(
  message: string,
  redirectOnSuccess: boolean
) {
  if (!redirectOnSuccess) {
    return NextResponse.json({ ok: false, message }, { status: 401 });
  }

  return new NextResponse(buildSystemSessionErrorHtml(message, sipConfig.label), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let redirectOnSuccess = false;

  try {
    const credentials = await readSystemLaunchCredentials(request);
    const { password } = credentials;
    redirectOnSuccess = credentials.redirectOnSuccess;
    const email = resolveSipEmail({
      phone: credentials.phone,
      password: credentials.password,
      corporateLoginId: credentials.corporateLoginId,
      sipEmail: credentials.sipEmail,
    });

    if (!email || !password) {
      return sipLaunchFailureResponse(
        "SIP requires an email address. Sign in to the hub with the email and password you use for SIP, or add your SIP email to your hub profile.",
        redirectOnSuccess
      );
    }

    const result = await createSipGatewaySession(email, password);

    if (!result.ok) {
      return sipLaunchFailureResponse(
        result.message ??
          "Unable to sign in to SIP with your hub credentials. Corporate and SIP accounts may use different logins.",
        redirectOnSuccess
      );
    }

    const openPath = SIP_GATEWAY_ENTRY;

    if (redirectOnSuccess) {
      const response = redirectAfterFormPost(new URL(openPath, request.url));
      attachSystemSessionCookie(
        response,
        SIP_SESSION_COOKIE,
        result.cookieHeader
      );
      return response;
    }

    const response = NextResponse.json({ ok: true, openUrl: openPath });
    attachSystemSessionCookie(response, SIP_SESSION_COOKIE, result.cookieHeader);
    return response;
  } catch {
    return sipLaunchFailureResponse(
      "Unable to start SIP session.",
      redirectOnSuccess
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SIP_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
