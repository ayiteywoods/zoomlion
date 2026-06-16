import { NextResponse } from "next/server";
import { resolveSipLoginId } from "@/lib/auth-credentials";
import { finishSystemLaunch } from "@/lib/external-system-launch";
import { createSipGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { buildSystemSessionErrorHtml } from "@/lib/system-session-bootstrap";
import {
  readSystemLaunchCredentials,
} from "@/lib/system-session-request";
import { SIP_ORIGIN } from "@/lib/sip-web-auth";
import { SIP_SESSION_COOKIE } from "@/lib/system-session-store";

const sipConfig = getSystemLaunchConfig("sip");
const SIP_GATEWAY_HOME = "/systems/gateway/sip";

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
    const loginId = resolveSipLoginId({
      phone: credentials.phone,
      password: credentials.password,
      corporateLoginId: credentials.corporateLoginId,
      sipEmail: credentials.sipEmail,
    });

    if (!loginId || !password) {
      return sipLaunchFailureResponse(
        "SIP requires an email address or phone number. Sign in to the hub with the credentials you use for SIP.",
        redirectOnSuccess
      );
    }

    const result = await createSipGatewaySession(loginId, password);

    if (!result.ok) {
      return sipLaunchFailureResponse(
        result.message ??
          "Unable to sign in to SIP with your hub credentials. Corporate and SIP accounts may use different logins.",
        redirectOnSuccess
      );
    }

    if (redirectOnSuccess) {
      return finishSystemLaunch({
        request,
        upstreamOrigin: SIP_ORIGIN,
        dashboardUrl: sipConfig.dashboardUrl,
        gatewayPath: SIP_GATEWAY_HOME,
        cookieHeader: result.cookieHeader,
        sessionCookieName: SIP_SESSION_COOKIE,
      });
    }

    return NextResponse.json({
      ok: true,
      openUrl: SIP_GATEWAY_HOME,
    });
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
