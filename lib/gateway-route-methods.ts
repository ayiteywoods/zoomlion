type GatewayHandler = (
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) => Promise<Response>;

/** Proxy all common HTTP methods through a gateway (Laravel apps use PUT/PATCH/DELETE too). */
export function gatewayRouteMethods(handler: GatewayHandler) {
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    HEAD: handler,
    OPTIONS: handler,
  };
}

export function rewriteGatewayBaseHref(
  html: string,
  gatewayPrefix: string,
  upstreamOrigin: string
): string {
  const prefix = gatewayPrefix.replace(/\/$/, "");
  const origin = upstreamOrigin.replace(/\/$/, "");

  return html
    .replace(
      new RegExp(`<base\\s+href="${origin.replace(/\./g, "\\.")}/?"`, "gi"),
      `<base href="${prefix}/"`
    )
    .replace(
      new RegExp(`<base\\s+href='${origin.replace(/\./g, "\\.")}/?'`, "gi"),
      `<base href='${prefix}/'`
    )
    .replace(/<base\s+href="\//gi, `<base href="${prefix}/"`);
}

/**
 * Rewrite root-relative asset URLs (script/link/img/etc.) onto the gateway.
 * Without this, browser requests /js/app.js from the hub and gets a login redirect.
 */
export function rewriteGatewayRootRelativeAssets(
  html: string,
  gatewayPrefix: string
): string {
  const prefix = gatewayPrefix.replace(/\/$/, "");
  const pathPrefix =
    new URL(prefix.startsWith("http") ? prefix : `http://local${prefix}`, "http://local")
      .pathname.replace(/\/$/, "") || "/systems/gateway";
  const escapedPath = pathPrefix
    .replace(/^\//, "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match "/foo" but not "//cdn..." and not paths already under the gateway.
  const rootRelative = new RegExp(
    `\\b(src|href|poster|data-src|data-href)=(["'])\\/(?!\\/|${escapedPath}\\/)`,
    "gi"
  );
  const cssUrl = new RegExp(
    `\\burl\\((["']?)\\/(?!\\/|${escapedPath}\\/)`,
    "gi"
  );

  return html
    .replace(rootRelative, `$1=$2${pathPrefix}/`)
    .replace(cssUrl, `url($1${pathPrefix}/`);
}
