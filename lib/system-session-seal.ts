import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SEC = 2 * 60 * 60;

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[JGC] AUTH_SESSION_SECRET is not set; system gateway sessions are insecure."
    );
  }
  return "jgc-dev-session-secret-not-for-production";
}

export type SealedSystemSession = {
  cookieHeader: string;
  bearerToken?: string;
  /** API token only — Corporate HTML UI is not available via gateway proxy */
  apiOnly?: boolean;
  loginPhone?: string;
  loginPassword?: string;
};

export function sealUpstreamSession(
  cookieHeader: string,
  bearerToken?: string,
  apiOnly = false,
  loginPhone?: string,
  loginPassword?: string
): string {
  const exp = Date.now() + SESSION_TTL_SEC * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      c: cookieHeader,
      t: bearerToken ?? "",
      a: apiOnly ? 1 : 0,
      p: loginPhone ?? "",
      w: loginPassword ?? "",
      exp,
    }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** @deprecated Use unsealSystemSession */
export function unsealUpstreamSession(token: string): string | null {
  const session = unsealSystemSession(token);
  return session?.cookieHeader ?? null;
}

export function unsealSystemSession(token: string): SealedSystemSession | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { c?: string; t?: string; a?: number; p?: string; w?: string; exp?: number };

    if (typeof data.c !== "string" || typeof data.exp !== "number") {
      return null;
    }
    if (data.exp <= Date.now()) return null;

    const bearerToken =
      typeof data.t === "string" && data.t.length > 0 ? data.t : undefined;
    const loginPhone =
      typeof data.p === "string" && data.p.length > 0 ? data.p : undefined;
    const loginPassword =
      typeof data.w === "string" && data.w.length > 0 ? data.w : undefined;

    return {
      cookieHeader: data.c,
      bearerToken,
      apiOnly: data.a === 1,
      loginPhone,
      loginPassword,
    };
  } catch {
    return null;
  }
}

export const SYSTEM_SESSION_MAX_AGE = SESSION_TTL_SEC;
