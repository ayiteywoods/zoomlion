import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SIP_ORIGIN,
  mergeSipCookieHeader,
  rewriteSipGatewayHtml,
} from "@/lib/sip-web-auth";
import { parseSetCookies } from "@/lib/system-auth-cookies";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import { SIP_GATEWAY_PATH } from "@/lib/sip-gateway-middleware";
import {
  getSystemSession,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-store";

const sipLoginUrl = getSystemLaunchConfig("sip").loginUrl;

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
  const cookieStore = await cookies();
  const sealed = cookieStore.get(SIP_SESSION_COOKIE)?.value;

  if (!sealed) {
    return NextResponse.redirect(sipLoginUrl, 303);
  }

  const session = getSystemSession(sealed);
  if (!session) {
    const response = NextResponse.redirect(sipLoginUrl, 303);
    response.cookies.set(SIP_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const { path = [] } = await context.params;
  const requestUrl = new URL(request.url);

  if (path.length === 1 && (path[0] === "home" || path[0] === "dashboard")) {
    const redirectUrl = new URL(SIP_GATEWAY_PATH, requestUrl.origin);
    redirectUrl.search = requestUrl.search;
    return NextResponse.redirect(redirectUrl, 302);
  }

  const targetPath = path.join("/");
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
    if (location) {
      const response = NextResponse.redirect(location, upstream.status);
      attachSystemSessionCookie(
        response,
        SIP_SESSION_COOKIE,
        updatedCookieHeader
      );
      return response;
    }
  }

  const upstreamType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  let body: ArrayBuffer | string = await upstream.arrayBuffer();

  if (upstreamType.includes("text/html")) {
    body = rewriteSipGatewayHtml(new TextDecoder().decode(body), gatewayPrefix);
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
