import type { NextResponse } from "next/server";
import { redirectAfterFormPost } from "@/lib/system-session-request";
import { SYSTEM_SESSION_MAX_AGE } from "@/lib/system-session-seal";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";

export function rootDomain(hostname: string): string {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

/** True when the hub can set upstream session cookies (e.g. hub.adudor.com → iwaste.adudor.com). */
export function canShareCookiesWithUpstream(
  requestHost: string,
  upstreamOrigin: string
): boolean {
  if (
    !requestHost ||
    requestHost === "localhost" ||
    requestHost === "127.0.0.1"
  ) {
    return false;
  }

  const upstreamHost = new URL(upstreamOrigin).hostname;
  if (requestHost === upstreamHost) return true;
  return requestHost.endsWith(`.${rootDomain(upstreamHost)}`);
}

export function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const jar = new Map<string, string>();

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }

  return jar;
}

export function attachUpstreamSessionCookies(
  response: NextResponse,
  cookieHeader: string,
  upstreamOrigin: string,
  requestHost: string
) {
  if (!canShareCookiesWithUpstream(requestHost, upstreamOrigin)) return;

  const upstreamHost = new URL(upstreamOrigin).hostname;
  const sharedDomain =
    requestHost === upstreamHost ? undefined : `.${rootDomain(upstreamHost)}`;

  for (const [name, value] of parseCookieHeader(cookieHeader)) {
    const isXsrf = name === "XSRF-TOKEN" || name === "xsrf-token";
    response.cookies.set(name, value, {
      ...(sharedDomain ? { domain: sharedDomain } : {}),
      path: "/",
      secure: true,
      httpOnly: !isXsrf,
      sameSite: "lax",
      maxAge: SYSTEM_SESSION_MAX_AGE,
    });
  }
}

type FinishLaunchOptions = {
  request: Request;
  upstreamOrigin: string;
  dashboardUrl: string;
  gatewayPath: string;
  cookieHeader: string;
  sessionCookieName: string;
  bearerToken?: string;
  apiOnly?: boolean;
  loginPhone?: string;
  loginPassword?: string;
};

/**
 * Use the hub gateway so server-side SSO cookies keep automatic sign-in working.
 * Set OPEN_EXTERNAL_SYSTEM_URLS=true (and not USE_SYSTEM_GATEWAY=true) on a hub
 * deployed on the same parent domain as the system to open real URLs instead.
 */
export function finishSystemLaunch({
  request,
  upstreamOrigin,
  dashboardUrl,
  gatewayPath,
  cookieHeader,
  sessionCookieName,
  bearerToken,
  apiOnly,
  loginPhone,
  loginPassword,
}: FinishLaunchOptions): NextResponse {
  const requestHost = new URL(request.url).hostname;
  const forceGateway = process.env.USE_SYSTEM_GATEWAY === "true";
  const openDirect =
    process.env.OPEN_EXTERNAL_SYSTEM_URLS === "true" &&
    !forceGateway &&
    canShareCookiesWithUpstream(requestHost, upstreamOrigin);

  if (openDirect) {
    const response = redirectAfterFormPost(dashboardUrl);
    attachUpstreamSessionCookies(
      response,
      cookieHeader,
      upstreamOrigin,
      requestHost
    );
    return response;
  }

  const response = redirectAfterFormPost(new URL(gatewayPath, request.url));
  attachSystemSessionCookie(
    response,
    sessionCookieName,
    cookieHeader,
    bearerToken,
    apiOnly,
    loginPhone,
    loginPassword
  );
  return response;
}

export function isDocumentNavigation(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
  const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
  const requestedWith = request.headers.get("x-requested-with") ?? "";

  if (requestedWith.toLowerCase() === "xmlhttprequest") return false;
  if (secFetchMode === "cors" || secFetchMode === "no-cors") return false;
  if (
    secFetchDest &&
    secFetchDest !== "document" &&
    secFetchDest !== "iframe"
  ) {
    return false;
  }

  return (
    secFetchDest === "document" ||
    secFetchMode === "navigate" ||
    (accept.includes("text/html") && !accept.startsWith("application/json"))
  );
}

export function buildUpstreamAccept(request: Request): string {
  if (isDocumentNavigation(request)) {
    return "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
  }
  return request.headers.get("accept") ?? "*/*";
}

export function shouldRedirectJsonAsHtml(
  request: Request,
  contentType: string
): boolean {
  return (
    isDocumentNavigation(request) &&
    (contentType.includes("application/json") ||
      contentType.includes("application/problem+json"))
  );
}
