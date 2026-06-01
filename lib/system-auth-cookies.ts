export type CookieJar = Map<string, string>;

export function readSetCookies(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

export function parseSetCookieHeader(setCookie: string | null): CookieJar {
  const jar = new Map<string, string>();
  if (!setCookie) return jar;

  for (const part of setCookie.split(/,(?=\s*[^;,]+=)/)) {
    const [pair] = part.split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }

  return jar;
}

export function parseSetCookies(response: Response): CookieJar {
  let jar = new Map<string, string>();
  for (const cookie of readSetCookies(response)) {
    jar = mergeCookieJars(jar, parseSetCookieHeader(cookie));
  }
  return jar;
}

export function mergeCookieJars(...jars: CookieJar[]): CookieJar {
  const merged = new Map<string, string>();
  for (const jar of jars) {
    for (const [key, value] of jar.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

export function cookieJarToHeader(jar: CookieJar): string {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export function extractCsrfToken(html: string): string | null {
  const match = html.match(/name="_token"\s+value="([^"]+)"/i);
  return match?.[1] ?? null;
}

export async function fetchLoginPage(loginUrl: string, jar: CookieJar) {
  const response = await fetch(loginUrl, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      Cookie: cookieJarToHeader(jar),
    },
    redirect: "manual",
  });

  const html = await response.text();
  const nextJar = mergeCookieJars(jar, parseSetCookies(response));

  return { html, jar: nextJar, status: response.status };
}

export function resolveRedirectUrl(
  location: string | null,
  fallback: string,
  baseUrl: string
): string {
  if (!location) return fallback;
  try {
    return new URL(location, baseUrl).toString();
  } catch {
    return fallback;
  }
}
