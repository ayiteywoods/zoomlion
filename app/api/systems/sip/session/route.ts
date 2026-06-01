import { NextResponse } from "next/server";
import { resolveSipEmail } from "@/lib/auth-credentials";
import { createSipGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { buildSystemSessionBootstrapHtml } from "@/lib/system-session-bootstrap";
import {
  readSystemLaunchCredentials,
  redirectAfterFormPost,
} from "@/lib/system-session-request";
import { SIP_GATEWAY_ENTRY } from "@/lib/sip-web-auth";
import { SIP_SESSION_COOKIE } from "@/lib/system-session-store";

const sipConfig = getSystemLaunchConfig("sip");

function hubLoginTarget(request: Request, reason?: string) {
  const url = new URL("/login", request.url);
  if (reason) url.searchParams.set("reason", reason);
  return url;
}

function redirectToHubLogin(
  request: Request,
  redirectOnSuccess: boolean,
  reason?: string
) {
  const target = hubLoginTarget(request, reason);

  if (redirectOnSuccess) {
    return redirectAfterFormPost(target);
  }

  return new NextResponse(
    buildSystemSessionBootstrapHtml(
      `${target.pathname}${target.search}`,
      sipConfig.label
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const credentials = await readSystemLaunchCredentials(request);
    const { password, redirectOnSuccess } = credentials;
    const email = resolveSipEmail({
      phone: credentials.phone,
      password: credentials.password,
      corporateLoginId: credentials.corporateLoginId,
      sipEmail: credentials.sipEmail,
    });

    if (!email || !password) {
      if (redirectOnSuccess) {
        return redirectAfterFormPost(
          new URL("/login?from=/dashboard", request.url)
        );
      }
      return NextResponse.json(
        {
          ok: false,
          message:
            "SIP requires an email address. Sign in to the hub with your SIP email.",
        },
        { status: 401 }
      );
    }

    const result = await createSipGatewaySession(email, password);

    if (!result.ok) {
      return redirectToHubLogin(request, redirectOnSuccess, "sip");
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

    const response = new NextResponse(
      buildSystemSessionBootstrapHtml(
        new URL(openPath, request.url).pathname,
        sipConfig.label
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
    attachSystemSessionCookie(response, SIP_SESSION_COOKIE, result.cookieHeader);
    return response;
  } catch {
    return redirectToHubLogin(request, true, "sip");
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
