import {
  cookieJarToHeader,
  extractCsrfToken,
  fetchLoginPage,
  mergeCookieJars,
  parseSetCookies,
  type CookieJar,
} from "@/lib/system-auth-cookies";

const IWASTE_ORIGIN = "https://iwaste.adudor.com";
const IWASTE_LOGIN_URL = `${IWASTE_ORIGIN}/login`;
const IWASTE_HOME_URL = `${IWASTE_ORIGIN}/home`;

export type IwasteWebLoginResult =
  | { ok: true; cookieHeader: string }
  | { ok: false; message?: string };

export async function loginIwasteWebSession(
  phone: string,
  password: string
): Promise<IwasteWebLoginResult> {
  const { html, jar } = await fetchLoginPage(IWASTE_LOGIN_URL, new Map());
  const csrf = extractCsrfToken(html);

  if (!csrf) {
    return { ok: false, message: "Unable to prepare iWaste sign-in." };
  }

  const body = new URLSearchParams({
    _token: csrf,
    login: phone,
    password,
  });

  const loginResponse = await fetch(IWASTE_LOGIN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookieJarToHeader(jar),
    },
    body,
    redirect: "manual",
  });

  const authenticatedJar = mergeCookieJars(jar, parseSetCookies(loginResponse));

  if (loginResponse.status === 422 || loginResponse.status === 401) {
    return {
      ok: false,
      message: "Your credentials do not have access to iWaste.",
    };
  }

  if (loginResponse.status >= 400) {
    return { ok: false, message: "Unable to sign in to iWaste." };
  }

  const cookieHeader = cookieJarToHeader(authenticatedJar);
  const hasSession = authenticatedJar.size > 0;

  if (!hasSession) {
    return { ok: false, message: "Unable to establish an iWaste session." };
  }

  const homeResponse = await fetch(IWASTE_HOME_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      Cookie: cookieHeader,
    },
    redirect: "manual",
  });

  const homeLocation = homeResponse.headers.get("location") ?? "";

  if (
    homeResponse.status === 302 &&
    homeLocation.includes("/login")
  ) {
    return {
      ok: false,
      message: "Your credentials do not have access to iWaste.",
    };
  }

  return { ok: true, cookieHeader };
}

export function mergeCookieHeader(existing: string, incoming: CookieJar): string {
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

export { IWASTE_ORIGIN };
