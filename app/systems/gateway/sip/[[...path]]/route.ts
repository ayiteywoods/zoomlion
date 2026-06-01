import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SIP_ORIGIN,
  isSipLoginPageHtml,
  mergeSipCookieHeader,
  rewriteSipGatewayHtml,
} from "@/lib/sip-web-auth";
import { parseSetCookies } from "@/lib/system-auth-cookies";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { SIP_GATEWAY_PATH } from "@/lib/sip-gateway-middleware";
import {
  SIP_BROWSING_COOKIE,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-constants";
import {
  getSystemSession,
} from "@/lib/system-session-store";

function redirectToHubLogin(requestUrl: URL) {
  const response = NextResponse.redirect(new URL("/login", requestUrl.origin), 303);
  for (const name of [SIP_SESSION_COOKIE, SIP_BROWSING_COOKIE] as const) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}

/** Upstream paths to try when /profile is missing (Laravel apps vary). */
const SIP_PROFILE_FALLBACKS = ["users/profile", "user/profile", "account"] as const;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function rewriteLocation(location: string | null, requestUrl: URL): string | null {
  if (!location) return null;

  try {
    const target = new URL(location, SIP_ORIGIN);
    if (!target.href.startsWith(SIP_ORIGIN)) return location;

    const basePath = new URL(SIP_ORIGIN).pathname.replace(/\/$/, "");
    const relativePath = target.pathname.startsWith(basePath)
      ? target.pathname.slice(basePath.length) || "/"
      : target.pathname;

    const loginPath =
      relativePath === "/login" || relativePath.startsWith("/login/");
    if (loginPath) {
      return new URL("/login", requestUrl.origin).toString();
    }

    const normalized =
      relativePath === "/" ||
      relativePath === "/dashboard" ||
      relativePath === "/home"
        ? ""
        : relativePath;
    const gatewayPath = `${SIP_GATEWAY_PATH}${normalized}${target.search}`;
    return new URL(gatewayPath, requestUrl.origin).toString();
  } catch {
    return location;
  }
}

async function proxySipRequest(request: Request, context: RouteContext) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const sealed = cookieStore.get(SIP_SESSION_COOKIE)?.value;

  if (!sealed) {
    return redirectToHubLogin(requestUrl);
  }

  const session = getSystemSession(sealed);
  if (!session) {
    return redirectToHubLogin(requestUrl);
  }

  const { path = [] } = await context.params;
  const targetPath = path.join("/");

  if (
    targetPath === "login" ||
    targetPath.startsWith("login/")
  ) {
    return redirectToHubLogin(requestUrl);
  }

  if (path.length === 1 && (path[0] === "home" || path[0] === "dashboard")) {
    const redirectUrl = new URL(SIP_GATEWAY_PATH, requestUrl.origin);
    redirectUrl.search = requestUrl.search;
    return NextResponse.redirect(redirectUrl, 302);
  }

  const targetUrl = targetPath
    ? `${SIP_ORIGIN}/${targetPath}${requestUrl.search}`
    : `${SIP_ORIGIN}/${requestUrl.search}`;
  const gatewayPrefix = new URL("/systems/gateway/sip", requestUrl.origin).toString();

  const headers: Record<string, string> = {
    Cookie: session.cookieHeader,
    Accept: request.headers.get("accept") ?? "*/*",
  };

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream = await fetch(targetUrl, init);
  let updatedCookieHeader = mergeSipCookieHeader(
    session.cookieHeader,
    parseSetCookies(upstream)
  );

  if (upstream.status === 404) {
    if (targetPath === "profile") {
      for (const fallbackPath of SIP_PROFILE_FALLBACKS) {
        const fallbackUrl = `${SIP_ORIGIN}/${fallbackPath}${requestUrl.search}`;
        const retry = await fetch(fallbackUrl, init);
        if (retry.status !== 404) {
          upstream = retry;
          updatedCookieHeader = mergeSipCookieHeader(
            updatedCookieHeader,
            parseSetCookies(upstream)
          );
          break;
        }
      }
    }

    if (
      upstream.status === 404 &&
      (targetPath === "dashboard" ||
        targetPath === "home" ||
        targetPath === "profile")
    ) {
      const redirectUrl = new URL(SIP_GATEWAY_PATH, requestUrl.origin);
      redirectUrl.search = requestUrl.search;
      const response = NextResponse.redirect(redirectUrl, 302);
      attachSystemSessionCookie(
        response,
        SIP_SESSION_COOKIE,
        updatedCookieHeader
      );
      return response;
    }
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = rewriteLocation(upstream.headers.get("location"), requestUrl);
    const redirectTarget =
      location ?? upstream.headers.get("location");
    if (redirectTarget) {
      const redirectUrl = new URL(redirectTarget, requestUrl.origin);
      if (
        redirectUrl.origin !== requestUrl.origin ||
        redirectUrl.pathname === "/login"
      ) {
        return redirectToHubLogin(requestUrl);
      }
      const response = NextResponse.redirect(redirectUrl, upstream.status);
      attachSystemSessionCookie(
        response,
        SIP_SESSION_COOKIE,
        updatedCookieHeader
      );
      return response;
    }
    return redirectToHubLogin(requestUrl);
  }

  const upstreamType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  let body: ArrayBuffer | string = await upstream.arrayBuffer();

  if (upstreamType.includes("text/html")) {
    const html = new TextDecoder().decode(body);
    if (isSipLoginPageHtml(html)) {
      return redirectToHubLogin(requestUrl);
    }
    body = rewriteSipGatewayHtml(html, gatewayPrefix);
  }

  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstreamType,
      "Cache-Control": "no-store",
    },
  });

  attachSystemSessionCookie(response, SIP_SESSION_COOKIE, updatedCookieHeader);

  return response;
}

export async function GET(request: Request, context: RouteContext) {
  return proxySipRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxySipRequest(request, context);
}
