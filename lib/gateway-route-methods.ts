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
