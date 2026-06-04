import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  extractAuthToken,
  getLoginErrorMessage,
  isEmailIdentifier,
  loginWithCredentials,
} from "@/lib/auth-api";
import {
  ACCOUNT_NOT_FOUND_MESSAGE,
  loginConsolidatedAuth,
} from "@/lib/consolidated-auth";
import {
  attachHubSessionCookies,
  HUB_PASSWORD_SETUP_COOKIE,
  PENDING_PASSWORD_RESET_COOKIE,
  PENDING_RESET_FLOW_COOKIE,
  PENDING_RESET_TOKEN_COOKIE,
} from "@/lib/auth";
import { phonesMatch } from "@/lib/password-reset-api";

function clearPendingResetCookies(response: NextResponse) {
  for (const name of [
    PENDING_PASSWORD_RESET_COOKIE,
    PENDING_RESET_FLOW_COOKIE,
    PENDING_RESET_TOKEN_COOKIE,
  ] as const) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

function setPendingResetCookies(
  response: NextResponse,
  phoneNo: string,
  flow: "first-time" | "forgot-password",
  token: string | null
) {
  response.cookies.set(PENDING_PASSWORD_RESET_COOKIE, phoneNo, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  response.cookies.set(PENDING_RESET_FLOW_COOKIE, flow, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  if (token) {
    response.cookies.set(PENDING_RESET_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }
}

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const phoneNo =
      (typeof incoming.get("phone_no") === "string"
        ? incoming.get("phone_no")
        : null) ??
      (typeof incoming.get("username") === "string"
        ? incoming.get("username")
        : null) ??
      (typeof incoming.get("identifier") === "string"
        ? incoming.get("identifier")
        : null);
    const password = incoming.get("password");

    if (typeof phoneNo !== "string" || !phoneNo.trim()) {
      return NextResponse.json(
        { message: "Username or phone number is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = phoneNo.trim();
    const postReset =
      incoming.get("post_reset") === "1" ||
      incoming.get("post_reset") === "true";
    const cookieStore = await cookies();
    const hubSetupPhone = cookieStore.get(HUB_PASSWORD_SETUP_COOKIE)?.value;
    const hubSetupComplete =
      postReset ||
      (hubSetupPhone
        ? phonesMatch(hubSetupPhone, trimmedIdentifier)
        : false);

    if (!isEmailIdentifier(trimmedIdentifier)) {
      const consolidated = await loginConsolidatedAuth(
        trimmedIdentifier,
        password,
        {
          skipResetRedirect: hubSetupComplete,
          hubSetupComplete,
        }
      );

      if (!consolidated.ok) {
        return NextResponse.json(
          { message: ACCOUNT_NOT_FOUND_MESSAGE },
          { status: 404 }
        );
      }

      const resetToken = extractAuthToken(consolidated.data);

      if (consolidated.resetRedirect === "first-time") {
        const response = NextResponse.json({
          requiresFirstTimeSetup: true,
          phone_no: consolidated.phoneNo,
          message:
            "Welcome. Please set a new password to activate your consolidated account.",
        });
        setPendingResetCookies(
          response,
          consolidated.phoneNo,
          "first-time",
          resetToken
        );
        return response;
      }

      const response = NextResponse.json(consolidated.data);
      clearPendingResetCookies(response);
      attachHubSessionCookies(response);
      response.cookies.set(HUB_PASSWORD_SETUP_COOKIE, consolidated.phoneNo, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    const result = await loginWithCredentials(trimmedIdentifier, password);

    if (!result.ok) {
      const status = result.status === 422 ? 401 : result.status || 401;
      return NextResponse.json({ message: result.message }, { status });
    }

    const response = NextResponse.json(result.data);
    attachHubSessionCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      { message: getLoginErrorMessage(null) },
      { status: 500 }
    );
  }
}
