/**
 * Resolve the public site origin when the app sits behind Nginx/PM2 on localhost.
 * Prefer APP_URL / forwarded headers so redirects never become https://localhost:3001/...
 */
export function getPublicOrigin(request: Request): string {
  const configured =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to request headers
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    (forwardedHost ? forwardedHost.split(",")[0]?.trim() : "") ||
    request.headers.get("host")?.trim() ||
    "";

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    (forwardedProto ? forwardedProto.split(",")[0]?.trim() : "") ||
    (host && !isLoopbackHost(host) ? "https" : "") ||
    new URL(request.url).protocol.replace(":", "") ||
    "https";

  if (host && !isLoopbackHost(host)) {
    return `${proto}://${host}`;
  }

  // Fallback for local development without a proxy.
  return new URL(request.url).origin;
}

export function getPublicRequestUrl(request: Request): URL {
  const origin = getPublicOrigin(request);
  const incoming = new URL(request.url);
  return new URL(`${incoming.pathname}${incoming.search}${incoming.hash}`, origin);
}

function isLoopbackHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}
