import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CORPORATE_ORIGIN,
  discoverCorporateAuthenticatedPath,
  isCorporateLoginGetPath,
  isCorporateLoginPageHtml,
  mergeCorporateCookieHeader,
  retryCorporateWebLogin,
  rewriteCorporateGatewayHtml,
} from "@/lib/corporate-web-auth";
import { buildCorporateApiShellHtml } from "@/lib/corporate-gateway-shell";
import { attachSystemSessionCookie } from "@/lib/system-session-cookie";
import { parseSetCookies } from "@/lib/system-auth-cookies";
import { getSystemLaunchConfig } from "@/lib/system-launch";
import {
  CORPORATE_SESSION_COOKIE,
  getSystemSession,
  type StoredSystemSession,
} from "@/lib/system-session-store";

const corporateLoginUrl = getSystemLaunchConfig("corporate").loginUrl;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function rewriteLocation(location: string | null, requestUrl: URL): string | null {
  if (!location) return null;

  try {
    const target = new URL(location, CORPORATE_ORIGIN);
    if (target.origin !== CORPORATE_ORIGIN) return location;

    const pathname = target.pathname === "/" ? "" : target.pathname;
    const gatewayPath = `/systems/gateway/corporate${pathname}${target.search}`;
    return new URL(gatewayPath, requestUrl.origin).toString();
  } catch {
    return location;
  }
}

function redirectToCorporateLogin() {
  return NextResponse.redirect(corporateLoginUrl, 303);
}

async function serveCorporateApiShell(session: StoredSystemSession) {
  let userName: string | undefined;
  let userPhone = session.loginPhone;

  if (session.bearerToken) {
    try {
      const response = await fetch(`${CORPORATE_ORIGIN}/api/user`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.bearerToken}`,
        },
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          data?: { name?: string; phone?: string };
          name?: string;
          phone?: string;
        };
        const profile = payload.data ?? payload;
        userName = profile.name;
        userPhone = userPhone ?? profile.phone;
      }
    } catch {
      // optional profile for the shell page
    }
  }

  return new NextResponse(
    buildCorporateApiShellHtml({ userName, userPhone }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

function isLoginRedirect(location: string | null): boolean {
  if (!location) return false;
  try {
    const url = new URL(location, CORPORATE_ORIGIN);
    return url.pathname.includes("/login");
  } catch {
    return location.includes("/login");
  }
}

async function proxyCorporateRequest(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(CORPORATE_SESSION_COOKIE)?.value;

  const requestUrl = new URL(request.url);

  if (!sealed) {
    return redirectToCorporateLogin();
  }

  const session = getSystemSession(sealed);
  if (!session) {
    const response = redirectToCorporateLogin();
    response.cookies.set(CORPORATE_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const { path = [] } = await context.params;
  const targetPath = path.join("/");

  if (
    request.method === "GET" &&
    !targetPath &&
    session.loginPhone &&
    session.loginPassword &&
    !session.cookieHeader.trim()
  ) {
    const retried = await retryCorporateWebLogin(
      session.loginPhone,
      session.loginPassword
    );
    if (retried.ok) {
      const retryPath = `/systems/gateway/corporate${retried.entryPath}`;
      const response = NextResponse.redirect(
        new URL(retryPath, request.url),
        303
      );
      attachSystemSessionCookie(
        response,
        CORPORATE_SESSION_COOKIE,
        retried.cookieHeader,
        session.bearerToken,
        false,
        session.loginPhone,
        session.loginPassword
      );
      return response;
    }
  }

  if (request.method === "GET" && isCorporateLoginGetPath(targetPath)) {
    return NextResponse.redirect(
      new URL("/systems/gateway/corporate", request.url),
      303
    );
  }

  const finalTarget = targetPath
    ? `${CORPORATE_ORIGIN}/${targetPath}${requestUrl.search}`
    : `${CORPORATE_ORIGIN}${requestUrl.search}`;

  const gatewayPrefix = new URL(
    "/systems/gateway/corporate",
    requestUrl.origin
  ).toString();

  const headers: Record<string, string> = {
    Accept: request.headers.get("accept") ?? "*/*",
  };

  if (session.cookieHeader) {
    headers.Cookie = session.cookieHeader;
  }
  if (session.bearerToken) {
    headers.Authorization = `Bearer ${session.bearerToken}`;
  }

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

  const upstream = await fetch(finalTarget, init);
  const updatedCookieHeader = mergeCorporateCookieHeader(
    session.cookieHeader,
    parseSetCookies(upstream)
  );

  if (upstream.status === 419) {
    const response = redirectToCorporateLogin();
    response.cookies.set(CORPORATE_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (upstream.status === 405 && request.method === "GET") {
    const response = NextResponse.redirect(
      new URL("/systems/gateway/corporate", request.url)
    );
    attachSystemSessionCookie(
      response,
      CORPORATE_SESSION_COOKIE,
      updatedCookieHeader,
      session.bearerToken,
      session.apiOnly,
      session.loginPhone,
      session.loginPassword
    );
    return response;
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    const rawLocation = upstream.headers.get("location");

    if (isLoginRedirect(rawLocation)) {
      if (session.bearerToken) {
        const discovered = await discoverCorporateAuthenticatedPath({
          cookieHeader: updatedCookieHeader,
          bearerToken: session.bearerToken,
        });
        if (discovered !== null) {
          const response = NextResponse.redirect(
            new URL(`/systems/gateway/corporate${discovered}`, request.url),
            303
          );
          attachSystemSessionCookie(
            response,
            CORPORATE_SESSION_COOKIE,
            updatedCookieHeader,
            session.bearerToken,
            session.apiOnly,
            session.loginPhone,
            session.loginPassword
          );
          return response;
        }
      }

      if (session.bearerToken) {
        return serveCorporateApiShell(session);
      }

      const response = redirectToCorporateLogin();
      response.cookies.set(CORPORATE_SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const location = rewriteLocation(rawLocation, requestUrl);
    if (location) {
      const response = NextResponse.redirect(location, 303);
      attachSystemSessionCookie(
        response,
        CORPORATE_SESSION_COOKIE,
        updatedCookieHeader,
        session.bearerToken,
        session.apiOnly,
        session.loginPhone,
        session.loginPassword
      );
      return response;
    }
  }

  const upstreamType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  let body: ArrayBuffer | string = await upstream.arrayBuffer();

  if (upstreamType.includes("text/html")) {
    const html = new TextDecoder().decode(body);
    if (isCorporateLoginPageHtml(html)) {
      if (session.loginPhone && session.loginPassword) {
        const retried = await retryCorporateWebLogin(
          session.loginPhone,
          session.loginPassword,
          session.cookieHeader
        );

        if (retried.ok) {
          const retryPath = `/systems/gateway/corporate${retried.entryPath}`;
          const response = NextResponse.redirect(
            new URL(retryPath, request.url),
            303
          );
          attachSystemSessionCookie(
            response,
            CORPORATE_SESSION_COOKIE,
            retried.cookieHeader,
            session.bearerToken,
            false,
            session.loginPhone,
            session.loginPassword
          );
          return response;
        }
      }

      if (session.loginPhone) {
        body = rewriteCorporateGatewayHtml(
          html,
          gatewayPrefix,
          session.loginPhone
        );
        const response = new NextResponse(body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstreamType,
            "Cache-Control": "no-store",
          },
        });
        attachSystemSessionCookie(
          response,
          CORPORATE_SESSION_COOKIE,
          updatedCookieHeader,
          session.bearerToken,
          session.apiOnly,
          session.loginPhone,
          session.loginPassword
        );
        return response;
      }

      return serveCorporateApiShell(session);
    }
    body = rewriteCorporateGatewayHtml(html, gatewayPrefix, session.loginPhone);
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
    CORPORATE_SESSION_COOKIE,
    updatedCookieHeader,
    session.bearerToken,
    session.apiOnly,
    session.loginPhone,
    session.loginPassword
  );

  return response;
}

export async function GET(request: Request, context: RouteContext) {
  return proxyCorporateRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyCorporateRequest(request, context);
}
