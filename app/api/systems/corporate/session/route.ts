import { NextResponse } from "next/server";
import { CORPORATE_ORIGIN } from "@/lib/corporate-web-auth";
import { finishSystemLaunch } from "@/lib/external-system-launch";
import { createCorporateGatewaySession } from "@/lib/system-auth";
import { getSystemLaunchConfig } from "@/lib/system-launch";
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

    const entryUrl = new URL(result.entryPath || "/", CORPORATE_ORIGIN).toString();
    const gatewayPath = `/systems/gateway/corporate${result.entryPath}`;

    if (redirectOnSuccess) {
      return finishSystemLaunch({
        request,
        upstreamOrigin: CORPORATE_ORIGIN,
        dashboardUrl: entryUrl,
        gatewayPath,
        cookieHeader: result.cookieHeader,
        sessionCookieName: CORPORATE_SESSION_COOKIE,
        bearerToken: result.bearerToken,
        apiOnly: result.apiOnly,
        loginPhone: result.loginPhone,
        loginPassword: result.loginPassword,
      });
    }

    return NextResponse.json({
      ok: true,
      openUrl: gatewayPath,
    });
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
