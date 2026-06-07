import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import {
  AUTH_CLEAR_COOKIES,
  AUTH_COOKIE,
  AUTH_LAST_ACTIVITY_COOKIE,
  HUB_SESSION_COOKIE,
  PENDING_PASSWORD_RESET_COOKIE,
  PENDING_RESET_FLOW_COOKIE,
  PENDING_RESET_TOKEN_COOKIE,
  isHubSessionActive,
} from "@/lib/auth";
import {
  isCorporateGatewayReferer,
  shouldRedirectHubPathToCorporateGateway,
} from "@/lib/corporate-gateway-middleware";
import {
  isSipGatewayReferer,
  resolveSipGatewayUrlForHubPath,
  shouldRedirectHubPathToSipGateway,
} from "@/lib/sip-gateway-middleware";
import {
  CORPORATE_BROWSING_COOKIE,
  CORPORATE_SESSION_COOKIE,
  IWASTE_SESSION_COOKIE,
  SIP_BROWSING_COOKIE,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-constants";

function hasSystemGatewaySession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(IWASTE_SESSION_COOKIE)?.value ||
      request.cookies.get(CORPORATE_SESSION_COOKIE)?.value ||
      request.cookies.get(SIP_SESSION_COOKIE)?.value
  );
}

const PUBLIC_PATHS = ["/login", "/reset-password"];

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/systems/")) return true;
  if (pathname.startsWith("/systems/launch/")) return true;

  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function clearAuthCookies(response: NextResponse) {
  for (const name of AUTH_CLEAR_COOKIES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

function isSessionActive(request: NextRequest): boolean {
  return isHubSessionActive(
    request.cookies.get(AUTH_COOKIE)?.value,
    request.cookies.get(AUTH_LAST_ACTIVITY_COOKIE)?.value,
    request.cookies.get(HUB_SESSION_COOKIE)?.value
  );
}

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

function wantsCancelReset(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get("cancelReset") === "1";
}

function clearSipBrowsingCookies(response: NextResponse) {
  response.cookies.set(SIP_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SIP_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function clearSystemBrowsingFlags(response: NextResponse) {
  response.cookies.set(SIP_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(CORPORATE_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
}

function getPendingResetRedirectUrl(request: NextRequest): URL | null {
  const pendingResetPhone = request.cookies.get(
    PENDING_PASSWORD_RESET_COOKIE
  )?.value;
  if (!pendingResetPhone) return null;

  const resetUrl = new URL("/reset-password", request.url);
  resetUrl.searchParams.set("phone", pendingResetPhone);
  const pendingFlow = request.cookies.get(PENDING_RESET_FLOW_COOKIE)?.value;
  if (pendingFlow === "forgot-password") {
    resetUrl.searchParams.set("flow", "forgot");
  } else {
    resetUrl.searchParams.set("firstLogin", "1");
  }
  return resetUrl;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = isSessionActive(request);
  const hadAuthCookie = request.cookies.get(AUTH_COOKIE)?.value === "1";

  if (hadAuthCookie && !isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "idle");
    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  if (pathname === "/") {
    const pendingResetUrl = getPendingResetRedirectUrl(request);
    if (pendingResetUrl) {
      return NextResponse.redirect(pendingResetUrl);
    }
    const response = NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url)
    );
    if (!isAuthenticated) {
      clearSipBrowsingCookies(response);
    } else {
      const referer = request.headers.get("referer");
      if (
        !isSipGatewayReferer(referer, request.url) &&
        !isCorporateGatewayReferer(referer, request.url)
      ) {
        clearSystemBrowsingFlags(response);
      }
    }
    return response;
  }

  if (
    pathname.startsWith("/systems/gateway/sip") &&
    !isAuthenticated
  ) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(SIP_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(SIP_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (pathname === "/login") {
    if (wantsCancelReset(request)) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    const hadPendingReset = Boolean(getPendingResetRedirectUrl(request));
    const response = NextResponse.next();
    if (!isSipGatewayReferer(request.headers.get("referer"), request.url)) {
      clearSipBrowsingCookies(response);
    }
    clearPendingResetCookies(response);

    if (isAuthenticated && !hadPendingReset) {
      const target = resolvePostLoginPath(request.nextUrl.searchParams.get("from"));
      return NextResponse.redirect(new URL(target, request.url));
    }

    return response;
  }

  const pendingResetUrl = getPendingResetRedirectUrl(request);

  if (
    pendingResetUrl &&
    !pathname.startsWith("/reset-password") &&
    !pathname.startsWith("/api/auth/reset") &&
    pathname !== "/login"
  ) {
    return NextResponse.redirect(pendingResetUrl);
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    if (
      pathname.startsWith("/systems/gateway/") &&
      hasSystemGatewaySession(request)
    ) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname === "/dashboard" &&
    !isSipGatewayReferer(request.headers.get("referer"), request.url) &&
    !isCorporateGatewayReferer(request.headers.get("referer"), request.url)
  ) {
    const hasStaleBrowsingFlag =
      request.cookies.get(SIP_BROWSING_COOKIE)?.value === "1" ||
      request.cookies.get(CORPORATE_BROWSING_COOKIE)?.value === "1";
    if (hasStaleBrowsingFlag) {
      const response = NextResponse.next();
      clearSystemBrowsingFlags(response);
      return response;
    }
  }

  if (shouldRedirectHubPathToSipGateway(pathname, request)) {
    const sipUrl = resolveSipGatewayUrlForHubPath(pathname, request.url);
    sipUrl.search = request.nextUrl.search;
    return NextResponse.redirect(sipUrl);
  }

  if (shouldRedirectHubPathToCorporateGateway(pathname, request)) {
    const corporateUrl = new URL(
      `/systems/gateway/corporate${pathname}`,
      request.url
    );
    corporateUrl.search = request.nextUrl.search;
    return NextResponse.redirect(corporateUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
