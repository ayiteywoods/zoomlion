import { NextResponse } from "next/server";
import { buildSystemSessionBootstrapHtml } from "@/lib/system-session-bootstrap";
import { createCorporateGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import {
  readSystemLaunchCredentials,
  redirectAfterFormPost,
} from "@/lib/system-session-request";
import { CORPORATE_SESSION_COOKIE } from "@/lib/system-session-store";

const corporateConfig = getSystemLaunchConfig("corporate");
const corporateLoginUrl = corporateConfig.loginUrl;

export async function POST(request: Request) {
  try {
    const { phone, password, corporateLoginId, redirectOnSuccess } =
      await readSystemLaunchCredentials(request);

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

    const result = await createCorporateGatewaySession(
      phone,
      password,
      corporateLoginId
    );

    if (!result.ok) {
      if (redirectOnSuccess) {
        return redirectAfterFormPost(corporateLoginUrl);
      }

      return NextResponse.json(
        {
          ok: false,
          message: "Unable to sign in to Corporate with your hub credentials.",
        },
        { status: 401 }
      );
    }

    const gatewayPath = `/systems/gateway/corporate${result.entryPath}`;

    if (redirectOnSuccess) {
      const response = new NextResponse(
        buildSystemSessionBootstrapHtml(gatewayPath, corporateConfig.label),
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      );
      attachSystemSessionCookie(
        response,
        CORPORATE_SESSION_COOKIE,
        result.cookieHeader,
        result.bearerToken,
        false,
        result.loginPhone,
        result.loginPassword
      );
      return response;
    }

    const gatewayUrl = new URL(gatewayPath, request.url);

    const response = NextResponse.json({
      ok: true,
      openUrl: gatewayUrl.pathname,
    });
    attachSystemSessionCookie(
      response,
      CORPORATE_SESSION_COOKIE,
      result.cookieHeader,
      result.bearerToken,
      false,
      result.loginPhone,
      result.loginPassword
    );
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to start Corporate session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CORPORATE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
