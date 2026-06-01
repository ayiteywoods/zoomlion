import type { NextResponse } from "next/server";
import { SYSTEM_SESSION_MAX_AGE } from "@/lib/system-session-seal";
import {
  CORPORATE_BROWSING_COOKIE,
  CORPORATE_SESSION_COOKIE,
  SIP_BROWSING_COOKIE,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-constants";
import { createSystemSession } from "@/lib/system-session-store";

export function attachSystemSessionCookie(
  response: NextResponse,
  cookieName: string,
  upstreamCookieHeader: string,
  bearerToken?: string,
  apiOnly = false,
  loginPhone?: string,
  loginPassword?: string
) {
  const sealed = createSystemSession(
    upstreamCookieHeader,
    bearerToken,
    apiOnly,
    loginPhone,
    loginPassword
  );
  response.cookies.set(cookieName, sealed, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SYSTEM_SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  if (cookieName === CORPORATE_SESSION_COOKIE) {
    response.cookies.set(CORPORATE_BROWSING_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SYSTEM_SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (cookieName === SIP_SESSION_COOKIE) {
    response.cookies.set(SIP_BROWSING_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SYSTEM_SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }
}
