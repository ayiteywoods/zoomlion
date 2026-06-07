import { CORPORATE_SESSION_COOKIE } from "@/lib/system-session-constants";

export const CORPORATE_GATEWAY_PATH = "/systems/gateway/corporate";

/** Hub routes that Corporate also uses — must stay under the gateway when browsing Corporate. */
export const CORPORATE_HUB_COLLISION_PATHS = ["/profile", "/dashboard"] as const;

export function isCorporateHubCollisionPath(pathname: string): boolean {
  return CORPORATE_HUB_COLLISION_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isCorporateGatewayReferer(
  referer: string | null,
  requestUrl: string
): boolean {
  if (!referer) return false;
  try {
    const ref = new URL(referer);
    const req = new URL(requestUrl);
    return (
      ref.origin === req.origin &&
      (ref.pathname === CORPORATE_GATEWAY_PATH ||
        ref.pathname.startsWith(`${CORPORATE_GATEWAY_PATH}/`))
    );
  } catch {
    return false;
  }
}

const HUB_APP_REFERER_PREFIXES = ["/dashboard", "/profile", "/login"];

export function isHubAppReferer(
  referer: string | null,
  requestUrl: string
): boolean {
  if (!referer) return false;
  try {
    const ref = new URL(referer);
    const req = new URL(requestUrl);
    if (ref.origin !== req.origin) return false;
    return HUB_APP_REFERER_PREFIXES.some(
      (path) => ref.pathname === path || ref.pathname.startsWith(`${path}/`)
    );
  } catch {
    return false;
  }
}

export function shouldRedirectHubPathToCorporateGateway(
  pathname: string,
  request: {
    cookies: { get: (name: string) => { value?: string } | undefined };
    headers: { get: (name: string) => string | null };
    url: string;
  }
): boolean {
  if (!isCorporateHubCollisionPath(pathname)) return false;
  if (!request.cookies.get(CORPORATE_SESSION_COOKIE)?.value) return false;

  const referer = request.headers.get("referer");
  return isCorporateGatewayReferer(referer, request.url);
}
