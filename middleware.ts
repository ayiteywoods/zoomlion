import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import {
  AUTH_CLEAR_COOKIES,
  AUTH_COOKIE,
  AUTH_LAST_ACTIVITY_COOKIE,
  isAuthIdleExpired,
  parseLastActivity,
} from "@/lib/auth";
import { shouldRedirectHubPathToCorporateGateway } from "@/lib/corporate-gateway-middleware";
import {
  isSipGatewayReferer,
  resolveSipGatewayUrlForHubPath,
  shouldRedirectHubPathToSipGateway,
} from "@/lib/sip-gateway-middleware";
import {
  CORPORATE_BROWSING_COOKIE,
  SIP_BROWSING_COOKIE,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-constants";

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
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === "1";
  if (!hasAuth) return false;

  const lastActivity = parseLastActivity(
    request.cookies.get(AUTH_LAST_ACTIVITY_COOKIE)?.value
  );

  if (isAuthIdleExpired(lastActivity)) return false;

  return true;
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
    const response = NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url)
    );
    if (!isAuthenticated) {
      response.cookies.set(SIP_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
      response.cookies.set(SIP_SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
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

  if (pathname === "/login" && !isSipGatewayReferer(request.headers.get("referer"), request.url)) {
    const response = NextResponse.next();
    response.cookies.set(SIP_BROWSING_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(SIP_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    if (isAuthenticated) {
      const target = resolvePostLoginPath(request.nextUrl.searchParams.get("from"));
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  if (isAuthenticated && pathname === "/login") {
    const target = resolvePostLoginPath(request.nextUrl.searchParams.get("from"));
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
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

  if (
    pathname === "/dashboard" &&
    request.cookies.get(SIP_BROWSING_COOKIE)?.value === "1" &&
    !request.headers.get("referer")?.includes("/systems/gateway/sip")
  ) {
    const response = NextResponse.next();
    response.cookies.set(SIP_BROWSING_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (
    pathname === "/dashboard" &&
    request.cookies.get(CORPORATE_BROWSING_COOKIE)?.value === "1" &&
    !request.headers.get("referer")?.includes("/systems/gateway/corporate")
  ) {
    const response = NextResponse.next();
    response.cookies.set(CORPORATE_BROWSING_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
