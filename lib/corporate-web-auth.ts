import { extractAuthToken, type LoginSuccessResponse } from "@/lib/auth-api";
import {
  cookieJarToHeader,
  extractCsrfToken,
  fetchLoginPage,
  mergeCookieJars,
  parseSetCookies,
  type CookieJar,
} from "@/lib/system-auth-cookies";
import { CORPORATE_GATEWAY_PATH } from "@/lib/corporate-gateway-middleware";
import { rewriteGatewayBaseHref } from "@/lib/gateway-route-methods";
import { injectGatewayNavigation } from "@/lib/gateway-navigation-inject";

export const CORPORATE_ORIGIN = "https://corporate.adudor.com";
const CORPORATE_LOGIN_PAGE = `${CORPORATE_ORIGIN}/`;
const CORPORATE_LOGIN_URL = `${CORPORATE_ORIGIN}/login`;

/** Upstream only accepts POST on /login; the sign-in form lives at /. */
const CORPORATE_STATIC_PREFIXES =
  "assets|build|css|js|storage|vendor|fonts|favicon";

export function isCorporateLoginGetPath(path: string): boolean {
  return /^login\/?$/i.test(path.replace(/\/$/, ""));
}

export function isCorporateLoginPageHtml(html: string): boolean {
  return (
    /action="[^"]*\/login"/i.test(html) &&
    html.includes('name="username"') &&
    html.includes("Sign In")
  );
}

const CORPORATE_CREDENTIALS_STORAGE_KEY = "zl-auth-credentials";

export function injectCorporateLoginAssist(html: string): string {
  if (!html.includes('name="password"')) return html;

  const script = `<script>
(function () {
  try {
    var raw = sessionStorage.getItem(${JSON.stringify(CORPORATE_CREDENTIALS_STORAGE_KEY)});
    if (!raw) return;
    var cred = JSON.parse(raw);
    var user = document.querySelector('input[name="username"]');
    var pass = document.querySelector('input[name="password"]');
    if (user && cred.phone && !user.value) user.value = cred.phone;
    if (pass && cred.password) pass.value = cred.password;
    var form = user && user.closest("form");
    if (form && cred.password) form.submit();
  } catch (e) {}
})();
</script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}</body>`);
  }
  return `${html}${script}`;
}

export function prefillCorporateLoginHtml(html: string, phone: string): string {
  const safe = phone.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  if (!safe) return html;

  return html
    .replace(
      /(<input[^>]*name="username"[^>]*)(value="")/i,
      `$1value="${safe}"`
    )
    .replace(
      /(<input[^>]*name="username"[^>]*)(\s*placeholder="Enter your phone number")/i,
      `$1 value="${safe}"$2`
    );
}

/** @deprecated Use injectGatewayNavigation from @/lib/gateway-navigation-inject */
export function injectCorporateGatewayNavigation(
  html: string,
  gatewayPathPrefix: string
): string {
  return injectGatewayNavigation(html, gatewayPathPrefix, {}, CORPORATE_ORIGIN);
}

export function rewriteCorporateGatewayHtml(
  html: string,
  gatewayPrefix: string,
  loginPhone?: string
): string {
  const prefix = gatewayPrefix.replace(/\/$/, "");
  const gatewayPath =
    new URL(prefix, "http://local").pathname || CORPORATE_GATEWAY_PATH;
  const staticExclusion = `(?!${CORPORATE_STATIC_PREFIXES})`;

  let out = html.replace(
    new RegExp(
      `https://corporate\\.adudor\\.com/${staticExclusion}([^"'\\s>]*)`,
      "g"
    ),
    (_, path: string) => `${prefix}/${path}`.replace(/([^:]\/)\/+/g, "$1")
  );

  out = out.replace(
    /href=(["'])\/\1/g,
    (_, quote: string) => `href=${quote}${prefix}${quote}`
  );

  out = out.replace(
    new RegExp(`href="/${staticExclusion}([^"]*)"`, "g"),
    `href="${prefix}/$1"`
  );
  out = out.replace(
    new RegExp(`href='/${staticExclusion}([^']*)'`, "g"),
    `href='${prefix}/$1'`
  );
  out = out.replace(
    new RegExp(`action="/${staticExclusion}([^"]*)"`, "g"),
    `action="${prefix}/$1"`
  );
  out = out.replace(
    new RegExp(`action='/${staticExclusion}([^']*)'`, "g"),
    `action='${prefix}/$1'`
  );

  // Avoid GET navigation to /login (upstream returns 405). Form POST to /login is kept.
  out = out.replace(new RegExp(`href="${prefix}/login/?"`, "gi"), `href="${prefix}"`);
  out = out.replace(new RegExp(`href='${prefix}/login/?'`, "gi"), `href='${prefix}'`);

  out = rewriteGatewayBaseHref(out, prefix, CORPORATE_ORIGIN);
  out = injectCorporateGatewayNavigation(out, gatewayPath);

  if (loginPhone) {
    out = prefillCorporateLoginHtml(out, loginPhone);
  }

  if (isCorporateLoginPageHtml(out)) {
    out = injectCorporateLoginAssist(out);
  }

  return out;
}

export type CorporateWebLoginResult =
  | { ok: true; cookieHeader: string; entryPath: string }
  | { ok: false; message?: string };

export async function verifyCorporateApiToken(
  bearerToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${CORPORATE_ORIGIN}/api/user`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      redirect: "manual",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function verifyCorporateWebSession(
  cookieHeader: string
): Promise<{ ok: true; entryPath: string } | { ok: false }> {
  if (!cookieHeader.trim()) return { ok: false };

  try {
    let url = `${CORPORATE_ORIGIN}/`;
    let jar = new Map<string, string>();

    for (const part of cookieHeader.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
    }

    for (let hop = 0; hop < 8; hop++) {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...laravelHeaders(jar),
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
      });

      jar = mergeCookieJars(jar, parseSetCookies(response));

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || location.includes("/login")) {
          return { ok: false };
        }
        url = new URL(location, CORPORATE_ORIGIN).href;
        continue;
      }

      if (!response.ok) return { ok: false };

      const html = await response.text();
      if (isCorporateLoginPageHtml(html)) return { ok: false };

      const entryPath = new URL(url, CORPORATE_ORIGIN).pathname;
      return { ok: true, entryPath: entryPath === "/" ? "" : entryPath };
    }

    return { ok: false };
  } catch {
    return { ok: false };
  }
}

function laravelHeaders(jar: CookieJar): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml",
    Cookie: cookieJarToHeader(jar),
  };

  const xsrf = jar.get("XSRF-TOKEN");
  if (xsrf) {
    try {
      headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);
    } catch {
      headers["X-XSRF-TOKEN"] = xsrf;
    }
  }

  return headers;
}

const CORPORATE_DASHBOARD_PATH_CANDIDATES = [
  "",
  "/home",
  "/dashboard",
  "/admin",
  "/admin/dashboard",
  "/user/home",
  "/portal",
  "/main",
];

/** Find a path that serves authenticated HTML (not the sign-in form). */
export async function discoverCorporateAuthenticatedPath(options: {
  cookieHeader?: string;
  bearerToken?: string;
}): Promise<string | null> {
  const { cookieHeader = "", bearerToken } = options;

  let jar = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }

  for (const path of CORPORATE_DASHBOARD_PATH_CANDIDATES) {
    const url = path ? `${CORPORATE_ORIGIN}${path}` : `${CORPORATE_ORIGIN}/`;
    const headers: Record<string, string> = {
      Accept: "text/html,application/xhtml+xml",
      ...laravelHeaders(jar),
    };
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        redirect: "manual",
      });

      jar = mergeCookieJars(jar, parseSetCookies(response));

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location && !location.includes("/login")) {
          const pathname = new URL(location, CORPORATE_ORIGIN).pathname;
          return pathname === "/" ? "" : pathname;
        }
        continue;
      }

      if (!response.ok) continue;

      const html = await response.text();
      if (!isCorporateLoginPageHtml(html)) {
        return path;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function corporateFetchHeaders(
  jar: CookieJar,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    ...laravelHeaders(jar),
    Referer: `${CORPORATE_ORIGIN}/`,
    Origin: CORPORATE_ORIGIN,
    ...extra,
  };
}

export function cookieHeaderToJar(cookieHeader: string): CookieJar {
  const jar = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return jar;
}

/** Server-side web login (same POST the Corporate login form uses in the browser). */
export async function retryCorporateWebLogin(
  loginPhone: string,
  password: string,
  existingCookieHeader = ""
): Promise<CorporateWebLoginResult | { ok: false }> {
  const loginIds = expandLoginIdentifiers(loginPhone, []);
  let jar = cookieHeaderToJar(existingCookieHeader);

  for (const loginId of loginIds) {
    jar = await prepareCorporateJar();
    if (existingCookieHeader) {
      jar = mergeCookieJars(jar, cookieHeaderToJar(existingCookieHeader));
    }

    const web = await loginCorporateWebInJar(jar, loginId, password);
    if (web.ok) return web;
    if ("jar" in web) jar = web.jar;
  }

  return { ok: false };
}

function expandLoginIdentifiers(
  username: string,
  extra: string[] = []
): string[] {
  const ids: string[] = [];

  const add = (value: string | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && !ids.includes(trimmed)) ids.push(trimmed);
  };

  for (const value of extra) add(value);
  add(username);

  for (const id of [...ids]) {
    if (/^0\d{9}$/.test(id)) add(id.slice(1));
    if (/^\d{9}$/.test(id)) add(`0${id}`);
  }

  return ids;
}

async function prepareCorporateJar(): Promise<CookieJar> {
  const { jar: pageJar } = await fetchLoginPage(CORPORATE_LOGIN_PAGE, new Map());

  try {
    const sanctum = await fetch(`${CORPORATE_ORIGIN}/sanctum/csrf-cookie`, {
      headers: corporateFetchHeaders(pageJar),
      redirect: "manual",
    });
    return mergeCookieJars(pageJar, parseSetCookies(sanctum));
  } catch {
    return pageJar;
  }
}

async function loginCorporateApiInJar(
  jar: CookieJar,
  loginId: string,
  password: string
): Promise<{ jar: CookieJar; bearerToken?: string; apiOk: boolean }> {
  try {
    const response = await fetch(`${CORPORATE_ORIGIN}/api/login`, {
      method: "POST",
      headers: corporateFetchHeaders(jar, {
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
      body: JSON.stringify({
        username: loginId.trim(),
        password,
      }),
    });

    const nextJar = mergeCookieJars(jar, parseSetCookies(response));
    let bearerToken: string | undefined;

    if (response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | LoginSuccessResponse
        | null;
      bearerToken = payload ? extractAuthToken(payload) ?? undefined : undefined;
    }

    return { jar: nextJar, bearerToken, apiOk: response.ok };
  } catch {
    return { jar, apiOk: false };
  }
}

async function loginCorporateWebInJar(
  jar: CookieJar,
  loginId: string,
  password: string,
  isRetry = false
): Promise<CorporateWebLoginResult | { ok: false; jar: CookieJar }> {
  const { html, jar: pageJar } = await fetchLoginPage(CORPORATE_LOGIN_PAGE, jar);
  const csrf = extractCsrfToken(html);

  if (!csrf) {
    return { ok: false, jar: pageJar, message: "Unable to prepare Corporate sign-in." };
  }

  const body = new URLSearchParams({
    _token: csrf,
    username: loginId.trim(),
    password,
  });

  const loginResponse = await fetch(CORPORATE_LOGIN_URL, {
    method: "POST",
    headers: corporateFetchHeaders(pageJar, {
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body,
    redirect: "manual",
  });

  let authenticatedJar = mergeCookieJars(pageJar, parseSetCookies(loginResponse));

  const redirectLocation = loginResponse.headers.get("location") ?? "";
  if (
    loginResponse.status >= 300 &&
    loginResponse.status < 400 &&
    redirectLocation &&
    !redirectLocation.includes("/login")
  ) {
    let nextUrl = new URL(redirectLocation, CORPORATE_ORIGIN).href;
    for (let hop = 0; hop < 10; hop++) {
      const followResponse = await fetch(nextUrl, {
        method: "GET",
        headers: laravelHeaders(authenticatedJar),
        redirect: "manual",
      });
      authenticatedJar = mergeCookieJars(
        authenticatedJar,
        parseSetCookies(followResponse)
      );

      if (followResponse.status >= 300 && followResponse.status < 400) {
        const nextLocation = followResponse.headers.get("location");
        if (!nextLocation || nextLocation.includes("/login")) break;
        nextUrl = new URL(nextLocation, CORPORATE_ORIGIN).href;
        continue;
      }

      if (followResponse.ok) {
        const followHtml = await followResponse.text();
        if (!isCorporateLoginPageHtml(followHtml)) {
          const entryPath = new URL(nextUrl, CORPORATE_ORIGIN).pathname;
          return {
            ok: true,
            cookieHeader: cookieJarToHeader(authenticatedJar),
            entryPath: entryPath === "/" ? "" : entryPath,
          };
        }
      }
      break;
    }
  }

  if (loginResponse.status === 419 && !isRetry) {
    return loginCorporateWebInJar(jar, loginId, password, true);
  }

  if (loginResponse.status === 419) {
    return {
      ok: false,
      jar: authenticatedJar,
      message: "Unable to prepare Corporate sign-in. Please try again.",
    };
  }

  if (loginResponse.status === 422 || loginResponse.status === 401) {
    return {
      ok: false,
      jar: authenticatedJar,
      message: "Your credentials do not have access to Corporate.",
    };
  }

  if (loginResponse.status >= 400) {
    return { ok: false, jar: authenticatedJar, message: "Unable to sign in to Corporate." };
  }

  if (
    loginResponse.status >= 300 &&
    loginResponse.status < 400 &&
    redirectLocation.includes("/login")
  ) {
    return {
      ok: false,
      jar: authenticatedJar,
      message: "Your credentials do not have access to Corporate.",
    };
  }

  const cookieHeader = cookieJarToHeader(authenticatedJar);
  if (!cookieHeader) {
    return {
      ok: false,
      jar: authenticatedJar,
      message: "Unable to establish a Corporate session.",
    };
  }

  const discovered = await discoverCorporateAuthenticatedPath({ cookieHeader });

  if (discovered !== null) {
    return {
      ok: true,
      cookieHeader,
      entryPath: discovered,
    };
  }

  const verified = await verifyCorporateWebSession(cookieHeader);
  if (!verified.ok) {
    return {
      ok: false,
      jar: authenticatedJar,
      message: "Your credentials do not have access to Corporate.",
    };
  }

  return {
    ok: true,
    cookieHeader,
    entryPath: verified.entryPath,
  };
}

export type EstablishCorporateSessionResult =
  | {
      ok: true;
      cookieHeader: string;
      bearerToken?: string;
      entryPath: string;
    }
  | { ok: false; message?: string };

/** API + web login sharing one cookie jar (matches browser session). */
export async function establishCorporateSession(
  username: string,
  password: string,
  extraLoginIds: string[] = []
): Promise<EstablishCorporateSessionResult> {
  const loginIds = expandLoginIdentifiers(username, extraLoginIds);
  let lastBearer: string | undefined;

  for (const loginId of loginIds) {
    let jar = await prepareCorporateJar();

    const web = await loginCorporateWebInJar(jar, loginId, password);
    if (web.ok) {
      const verified = await discoverCorporateAuthenticatedPath({
        cookieHeader: web.cookieHeader,
      });
      if (verified !== null) {
        return {
          ok: true,
          cookieHeader: web.cookieHeader,
          bearerToken: lastBearer,
          entryPath: verified,
        };
      }
    }

    if ("jar" in web && web.jar) {
      jar = web.jar;
    }

    const api = await loginCorporateApiInJar(jar, loginId, password);
    jar = api.jar;
    lastBearer = api.bearerToken ?? lastBearer;

    const cookieHeader = cookieJarToHeader(jar);
    if (cookieHeader) {
      const discovered = await discoverCorporateAuthenticatedPath({
        cookieHeader,
        bearerToken: api.bearerToken ?? lastBearer,
      });
      if (discovered !== null) {
        return {
          ok: true,
          cookieHeader,
          bearerToken: api.bearerToken ?? lastBearer,
          entryPath: discovered,
        };
      }
    }
  }

  return {
    ok: false,
    message: "Your credentials do not have access to Corporate.",
  };
}

export async function loginCorporateWebSession(
  username: string,
  password: string,
  isRetry = false
): Promise<CorporateWebLoginResult> {
  const jar = await prepareCorporateJar();
  const result = await loginCorporateWebInJar(jar, username, password, isRetry);
  if (result.ok) return result;
  return {
    ok: false,
    message:
      "message" in result ? result.message : "Unable to sign in to Corporate.",
  };
}

export function mergeCorporateCookieHeader(
  existing: string,
  incoming: CookieJar
): string {
  const jar = new Map<string, string>();

  for (const part of existing.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }

  for (const [name, value] of incoming.entries()) {
    jar.set(name, value);
  }

  return cookieJarToHeader(jar);
}

export function buildCorporateProxyRequestHeaders(
  request: Request,
  cookieHeader: string,
  bearerToken?: string
): Record<string, string> {
  const jar = cookieHeaderToJar(cookieHeader);
  const headers = corporateFetchHeaders(jar, {
    Accept: request.headers.get("accept") ?? "*/*",
  });

  const clientXsrf =
    request.headers.get("x-xsrf-token") ??
    request.headers.get("X-XSRF-TOKEN");
  if (clientXsrf) {
    headers["X-XSRF-TOKEN"] = clientXsrf;
  }

  const requestedWith = request.headers.get("x-requested-with");
  if (requestedWith) {
    headers["X-Requested-With"] = requestedWith;
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  return headers;
}
