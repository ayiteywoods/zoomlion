import { injectGatewayNavigation } from "@/lib/gateway-navigation-inject";
import {
  cookieJarToHeader,
  extractCsrfToken,
  fetchLoginPage,
  mergeCookieJars,
  parseSetCookies,
  type CookieJar,
} from "@/lib/system-auth-cookies";

export const SIP_ORIGIN = "https://sip.adudor.com";
export const SIP_API_BASE = `${SIP_ORIGIN}/api`;
export const SIP_GATEWAY_ENTRY = "/systems/gateway/sip";
const SIP_LOGIN_URL = `${SIP_ORIGIN}/login`;
const SIP_ENTRY_URL = `${SIP_ORIGIN}/`;

export function isSipLoginPageHtml(html: string): boolean {
  return (
    html.includes('name="email"') &&
    html.includes('name="password"') &&
    (html.includes("/login") || html.includes("Sign In") || html.includes("Login"))
  );
}

export type SipWebLoginResult =
  | { ok: true; cookieHeader: string }
  | { ok: false; message?: string };

function sipLoginIdCandidates(loginId: string): string[] {
  const trimmed = loginId.trim();
  if (!trimmed) return [];

  const candidates = [trimmed];
  if (!trimmed.includes("@")) {
    const digits = trimmed.replace(/\D/g, "");
    const local = digits.replace(/^233/, "").replace(/^0/, "");
    if (local) {
      candidates.push(`0${local}`, local, `233${local}`, `+233${local}`);
    }
  }

  return [...new Set(candidates)];
}

async function attemptSipWebLogin(
  loginId: string,
  password: string
): Promise<SipWebLoginResult> {
  const { html, jar } = await fetchLoginPage(SIP_LOGIN_URL, new Map());
  const csrf = extractCsrfToken(html);

  if (!csrf) {
    return { ok: false, message: "Unable to prepare SIP sign-in." };
  }

  const body = new URLSearchParams({
    _token: csrf,
    email: loginId,
    password,
  });

  const loginResponse = await fetch(SIP_LOGIN_URL, {
    method: "POST",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieJarToHeader(jar),
    },
    body,
    redirect: "manual",
  });

  const authenticatedJar = mergeCookieJars(jar, parseSetCookies(loginResponse));
  const loginLocation = loginResponse.headers.get("location") ?? "";

  if (loginResponse.status === 422 || loginResponse.status === 401) {
    return {
      ok: false,
      message: "Your credentials do not have access to SIP.",
    };
  }

  if (
    loginResponse.status >= 300 &&
    loginResponse.status < 400 &&
    loginLocation.includes("/login")
  ) {
    return {
      ok: false,
      message: "Your credentials do not have access to SIP.",
    };
  }

  if (loginResponse.status >= 400) {
    return { ok: false, message: "Unable to sign in to SIP." };
  }

  const cookieHeader = cookieJarToHeader(authenticatedJar);
  if (!authenticatedJar.size) {
    return { ok: false, message: "Unable to establish a SIP session." };
  }

  const entryResponse = await fetch(SIP_ENTRY_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      Cookie: cookieHeader,
    },
    redirect: "manual",
  });

  const entryLocation = entryResponse.headers.get("location") ?? "";
  if (
    entryResponse.status >= 300 &&
    entryResponse.status < 400 &&
    entryLocation.includes("/login")
  ) {
    return {
      ok: false,
      message: "Your credentials do not have access to SIP.",
    };
  }

  if (entryResponse.status === 404) {
    return { ok: false, message: "Unable to sign in to SIP." };
  }

  return { ok: true, cookieHeader };
}

export async function loginSipWebSession(
  loginId: string,
  password: string
): Promise<SipWebLoginResult> {
  const candidates = sipLoginIdCandidates(loginId);
  if (!candidates.length) {
    return {
      ok: false,
      message: "SIP sign-in requires an email address or phone number.",
    };
  }

  let lastFailure: SipWebLoginResult = {
    ok: false,
    message: "Your credentials do not have access to SIP.",
  };

  for (const candidate of candidates) {
    const result = await attemptSipWebLogin(candidate, password);
    if (result.ok) {
      return result;
    }
    lastFailure = result;
  }

  return lastFailure;
}

export function rewriteSipGatewayHtml(
  html: string,
  gatewayPrefix: string
): string {
  const prefix = gatewayPrefix.replace(/\/$/, "");
  const gatewayPath =
    new URL(prefix, "http://local").pathname || SIP_GATEWAY_ENTRY;
  const basePath = new URL(SIP_ORIGIN).pathname.replace(/\/$/, "");

  let out = html
    .replaceAll(SIP_ORIGIN, gatewayPrefix)
    .replaceAll(`href="${basePath}/`, `href="${gatewayPrefix}/`)
    .replaceAll(`action="${basePath}/`, `action="${gatewayPrefix}/`)
    .replace(/href="\/(?!\/)/g, `href="${gatewayPrefix}/`)
    .replace(/action="\/(?!\/)/g, `action="${gatewayPrefix}/`);

  out = injectGatewayNavigation(out, gatewayPath, {
    "/dashboard": "",
    "/home": "",
  }, SIP_ORIGIN);
  return out;
}

export function mergeSipCookieHeader(
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
