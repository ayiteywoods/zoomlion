import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { IWASTE_ORIGIN, mergeCookieHeader, rewriteIwasteGatewayHtml } from "@/lib/iwaste-web-auth";
import { gatewayRouteMethods } from "@/lib/gateway-route-methods";
import {
  buildUpstreamAccept,
  shouldRedirectJsonAsHtml,
} from "@/lib/external-system-launch";
import { getPublicOrigin, getPublicRequestUrl } from "@/lib/public-request-url";
import { parseSetCookies } from "@/lib/system-auth-cookies";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import {
  getSystemSession,
  IWASTE_SESSION_COOKIE,
} from "@/lib/system-session-store";

const iwasteLoginUrl = getSystemLaunchConfig("iwaste").loginUrl;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function rewriteLocation(
  location: string | null,
  publicOrigin: string
): string | null {
  if (!location) return null;

  try {
    const target = new URL(location, IWASTE_ORIGIN);
    if (target.origin !== IWASTE_ORIGIN) return location;

    const gatewayPath = `/systems/gateway/iwaste${target.pathname}${target.search}`;
    return new URL(gatewayPath, publicOrigin).toString();
  } catch {
    return location;
  }
}

function rewriteHtml(html: string, gatewayPrefix: string): string {
  return rewriteIwasteGatewayHtml(html, gatewayPrefix);
}

async function proxyIwasteRequest(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(IWASTE_SESSION_COOKIE)?.value;

  if (!sealed) {
    return NextResponse.redirect(iwasteLoginUrl, 303);
  }

  const session = getSystemSession(sealed);
  if (!session) {
    const response = NextResponse.redirect(iwasteLoginUrl, 303);
    response.cookies.set(IWASTE_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const { path = ["home"] } = await context.params;
  const requestUrl = getPublicRequestUrl(request);
  const publicOrigin = getPublicOrigin(request);
  const targetPath = path.join("/");
  const targetUrl = `${IWASTE_ORIGIN}/${targetPath}${requestUrl.search}`;
  const gatewayPrefix = new URL(
    "/systems/gateway/iwaste",
    publicOrigin
  ).toString();

  const headers: Record<string, string> = {
    Cookie: session.cookieHeader,
    Accept: buildUpstreamAccept(request),
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

  const upstream = await fetch(targetUrl, init);
  const updatedCookieHeader = mergeCookieHeader(
    session.cookieHeader,
    parseSetCookies(upstream)
  );

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = rewriteLocation(
      upstream.headers.get("location"),
      publicOrigin
    );
    if (location) {
      const response = NextResponse.redirect(location, upstream.status);
      attachSystemSessionCookie(
        response,
        IWASTE_SESSION_COOKIE,
        updatedCookieHeader
      );
      return response;
    }
  }

  const upstreamType = upstream.headers.get("content-type") ?? "application/octet-stream";

  if (shouldRedirectJsonAsHtml(request, upstreamType)) {
    const homePath = `/systems/gateway/iwaste/home${requestUrl.search}`;
    const response = NextResponse.redirect(new URL(homePath, publicOrigin), 303);
    attachSystemSessionCookie(
      response,
      IWASTE_SESSION_COOKIE,
      updatedCookieHeader
    );
    return response;
  }

  let body: ArrayBuffer | string = await upstream.arrayBuffer();

  if (upstreamType.includes("text/html")) {
    body = rewriteHtml(new TextDecoder().decode(body), gatewayPrefix);
  }

  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstreamType,
      "Cache-Control": "no-store",
    },
  });

  attachSystemSessionCookie(
    response,
    IWASTE_SESSION_COOKIE,
    updatedCookieHeader
  );

  return response;
}

export const { GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS } =
  gatewayRouteMethods(proxyIwasteRequest);
