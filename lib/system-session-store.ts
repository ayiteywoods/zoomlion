import {
  sealUpstreamSession,
  unsealSystemSession,
} from "@/lib/system-session-seal";

export {
  CORPORATE_BROWSING_COOKIE,
  CORPORATE_SESSION_COOKIE,
  IWASTE_SESSION_COOKIE,
  SIP_SESSION_COOKIE,
} from "@/lib/system-session-constants";

export type StoredSystemSession = {
  cookieHeader: string;
  bearerToken?: string;
  apiOnly?: boolean;
  loginPhone?: string;
  loginPassword?: string;
};

/** Seal upstream session state into a value stored in our httpOnly cookie. */
export function createSystemSession(
  cookieHeader: string,
  bearerToken?: string,
  apiOnly = false,
  loginPhone?: string,
  loginPassword?: string
): string {
  return sealUpstreamSession(
    cookieHeader,
    bearerToken,
    apiOnly,
    loginPhone,
    loginPassword
  );
}

export function getSystemSession(sealed: string): StoredSystemSession | null {
  const session = unsealSystemSession(sealed);
  if (!session) return null;
  return session;
}
