import { SIP_SESSION_COOKIE } from "@/lib/system-session-constants";

export const SIP_GATEWAY_PATH = "/systems/gateway/sip";

/** Hub routes that SIP also uses — must stay under the gateway when browsing SIP. */
export const SIP_HUB_COLLISION_PATHS = ["/profile", "/dashboard"] as const;

/** SIP has no /home or /dashboard; hub collision paths map here instead. */
const SIP_HUB_PATH_GATEWAY_SUFFIX: Partial<
  Record<(typeof SIP_HUB_COLLISION_PATHS)[number], string>
> = {
  "/dashboard": "",
};

export function resolveSipGatewayUrlForHubPath(
  hubPathname: string,
  requestUrl: string
): URL {
  const suffix =
    SIP_HUB_PATH_GATEWAY_SUFFIX[
      hubPathname as keyof typeof SIP_HUB_PATH_GATEWAY_SUFFIX
    ];
  if (suffix !== undefined) {
    return new URL(SIP_GATEWAY_PATH, requestUrl);
  }
  return new URL(`${SIP_GATEWAY_PATH}${hubPathname}`, requestUrl);
}

export function isSipHubCollisionPath(pathname: string): boolean {
  return SIP_HUB_COLLISION_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isSipGatewayReferer(
  referer: string | null,
  requestUrl: string
): boolean {
  if (!referer) return false;
  try {
    const ref = new URL(referer);
    const req = new URL(requestUrl);
    return (
      ref.origin === req.origin &&
      (ref.pathname === SIP_GATEWAY_PATH ||
        ref.pathname.startsWith(`${SIP_GATEWAY_PATH}/`))
    );
  } catch {
    return false;
  }
}

export function shouldRedirectHubPathToSipGateway(
  pathname: string,
  request: {
    cookies: { get: (name: string) => { value?: string } | undefined };
  }
): boolean {
  if (!isSipHubCollisionPath(pathname)) return false;
  return Boolean(request.cookies.get(SIP_SESSION_COOKIE)?.value);
}
