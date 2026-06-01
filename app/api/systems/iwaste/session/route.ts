import { NextResponse } from "next/server";
import { createIwasteGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { buildSystemSessionBootstrapHtml } from "@/lib/system-session-bootstrap";
import {
  readSystemLaunchCredentials,
  redirectAfterFormPost,
} from "@/lib/system-session-request";
import { IWASTE_SESSION_COOKIE } from "@/lib/system-session-store";

const iwasteConfig = getSystemLaunchConfig("iwaste");

function redirectToIwasteLogin(redirectOnSuccess: boolean) {
  if (redirectOnSuccess) {
    return redirectAfterFormPost(iwasteConfig.loginUrl);
  }

  return new NextResponse(
    buildSystemSessionBootstrapHtml(iwasteConfig.loginUrl, iwasteConfig.label),
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
  let redirectOnSuccess = false;

  try {
    const credentials = await readSystemLaunchCredentials(request);
    const { phone, password } = credentials;
    redirectOnSuccess = credentials.redirectOnSuccess;

    if (!phone || !password) {
      if (redirectOnSuccess) {
        return redirectAfterFormPost(
          new URL("/login?from=/dashboard", request.url)
        );
      }
      return NextResponse.json(
        {
          ok: false,
          message: "Saved credentials are missing. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const result = await createIwasteGatewaySession(phone, password);

    if (!result.ok) {
      if (redirectOnSuccess) {
        return redirectToIwasteLogin(true);
      }
      return NextResponse.json(
        {
          ok: false,
          message: "Unable to sign in to iWaste with your hub credentials.",
        },
        { status: 401 }
      );
    }

    const openPath = "/systems/gateway/iwaste/home";

    if (redirectOnSuccess) {
      const response = redirectAfterFormPost(new URL(openPath, request.url));
      attachSystemSessionCookie(
        response,
        IWASTE_SESSION_COOKIE,
        result.cookieHeader
      );
      return response;
    }

    const response = NextResponse.json({ ok: true, openUrl: openPath });
    attachSystemSessionCookie(
      response,
      IWASTE_SESSION_COOKIE,
      result.cookieHeader
    );
    return response;
  } catch {
    if (redirectOnSuccess) {
      return redirectToIwasteLogin(true);
    }
    return NextResponse.json(
      { ok: false, message: "Unable to start iWaste session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(IWASTE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
