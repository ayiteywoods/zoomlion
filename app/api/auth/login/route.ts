import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  extractAuthToken,
  extractAuthUser,
  getLoginErrorMessage,
  isEmailIdentifier,
  loginWithCredentialsDetailed,
} from "@/lib/auth-api";
import { resolveLoginResetRedirect } from "@/lib/consolidated-auth";
import {
  attachHubSessionCookies,
  HUB_PASSWORD_SETUP_COOKIE,
  PENDING_PASSWORD_RESET_COOKIE,
  PENDING_RESET_FLOW_COOKIE,
  PENDING_RESET_TOKEN_COOKIE,
} from "@/lib/auth";
import { formatAttemptSummary } from "@/lib/login-error-messages";
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

    const result = await loginWithCredentialsDetailed(
      trimmedIdentifier,
      password
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.message,
          code: result.code,
          systems: formatAttemptSummary(result.attempts),
        },
        { status: result.status || 401 }
      );
    }

    const user = extractAuthUser(result.data);
    const resolvedPhone =
      user?.phone_no?.trim() ||
      (!isEmailIdentifier(trimmedIdentifier) ? trimmedIdentifier : "");

    if (!isEmailIdentifier(trimmedIdentifier)) {
      const resetRedirect = hubSetupComplete
        ? ("none" as const)
        : await resolveLoginResetRedirect(result.data, { hubSetupComplete });
      const resetToken = extractAuthToken(result.data);

      if (resetRedirect === "first-time") {
        const response = NextResponse.json({
          requiresFirstTimeSetup: true,
          phone_no: resolvedPhone,
          message:
            "Welcome. Please set a new password to activate your consolidated account.",
        });
        setPendingResetCookies(
          response,
          resolvedPhone,
          "first-time",
          resetToken
        );
        return response;
      }

      const response = NextResponse.json(result.data);
      clearPendingResetCookies(response);
      attachHubSessionCookies(response);
      if (resolvedPhone) {
        response.cookies.set(HUB_PASSWORD_SETUP_COOKIE, resolvedPhone, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return response;
    }

    const response = NextResponse.json(result.data);
    clearPendingResetCookies(response);
    attachHubSessionCookies(response);
    return response;
  } catch {
    return NextResponse.json(
      { message: getLoginErrorMessage(null) },
      { status: 500 }
    );
  }
}
