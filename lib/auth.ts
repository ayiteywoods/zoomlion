import { clearAuthCredentials } from "@/lib/auth-credentials";
import {
  formatLastLoginLabel,
  formatSessionExpiresIn,
} from "@/lib/auth-session-display";
import {
  extractAuthToken,
  extractAuthUser,
  normalizeAuthUser,
  type AuthUser,
  type LoginSuccessResponse,
} from "@/lib/auth-api";

export const AUTH_UPDATED_EVENT = "zl-auth-updated";

export const AUTH_COOKIE = "zl-auth";
export const AUTH_STORAGE_KEY = "zl-auth";
export const AUTH_TOKEN_KEY = "zl-auth-token";
export const AUTH_USER_KEY = "zl-auth-user";
export const AUTH_LAST_ACTIVITY_KEY = "zl-auth-last-activity";
export const AUTH_LAST_ACTIVITY_COOKIE = "zl-auth-at";
export const AUTH_LAST_LOGIN_KEY = "zl-auth-last-login";
export const AUTH_REMEMBER_KEY = "zl-auth-remember";
export const AUTH_REMEMBER_COOKIE = "zl-auth-remember";
/** Set only after a successful hub login (server or client). */
export const HUB_SESSION_COOKIE = "zl-hub-session";

/** Session expires after 6 hours without user activity */
export const AUTH_IDLE_MS = 6 * 60 * 60 * 1000;
export const REMEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type AuthSession = {
  token: string | null;
  user: AuthUser | null;
};

function cookieMaxAgePart(remember: boolean): string {
  return remember ? `; max-age=${REMEMBER_COOKIE_MAX_AGE}` : "";
}

function writeClientCookie(name: string, value: string, remember: boolean) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax${cookieMaxAgePart(remember)}`;
}

function clearClientCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthIdleExpired(lastActivityMs: number): boolean {
  if (!Number.isFinite(lastActivityMs) || lastActivityMs <= 0) return true;
  return Date.now() - lastActivityMs > AUTH_IDLE_MS;
}

export function parseLastActivity(value: string | undefined | null): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Shared session check for middleware and server components. */
export function isHubSessionActive(
  authCookie: string | undefined | null,
  activityCookie: string | undefined | null,
  hubSessionCookie: string | undefined | null
): boolean {
  if (hubSessionCookie !== "1") return false;
  if (authCookie !== "1") return false;
  const lastActivity = parseLastActivity(activityCookie);
  return !isAuthIdleExpired(lastActivity);
}

export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  const parts = document.cookie.split(";").map((part) => part.trim());
  const hasAuth = parts.some((part) => part.startsWith(`${AUTH_COOKIE}=1`));
  const hasHubSession = parts.some((part) =>
    part.startsWith(`${HUB_SESSION_COOKIE}=1`)
  );
  return hasAuth && hasHubSession;
}

/** Remove auth cookies left behind without a completed login. */
export function clearOrphanAuthCookies() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(AUTH_STORAGE_KEY) === "true") return;
  clearClientCookie(AUTH_COOKIE);
  clearClientCookie(AUTH_LAST_ACTIVITY_COOKIE);
  clearClientCookie(HUB_SESSION_COOKIE);
  clearClientCookie(AUTH_REMEMBER_COOKIE);
}

export function touchAuthActivity(remember?: boolean) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(AUTH_STORAGE_KEY) !== "true") return;

  const rememberMe =
    remember !== undefined
      ? remember
      : localStorage.getItem(AUTH_REMEMBER_KEY) === "true" ||
        document.cookie.includes(`${AUTH_REMEMBER_COOKIE}=1`);

  const now = String(Date.now());
  localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, now);
  if (rememberMe) {
    localStorage.setItem(AUTH_REMEMBER_KEY, "true");
  }

  writeClientCookie(AUTH_LAST_ACTIVITY_COOKIE, now, rememberMe);
  writeClientCookie(AUTH_COOKIE, "1", rememberMe);
  writeClientCookie(HUB_SESSION_COOKIE, "1", rememberMe);

  if (rememberMe) {
    writeClientCookie(AUTH_REMEMBER_COOKIE, "1", true);
  } else {
    clearClientCookie(AUTH_REMEMBER_COOKIE);
  }
}

export function setAuthenticated(
  remember: boolean,
  loginResponse?: LoginSuccessResponse
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_STORAGE_KEY, "true");
  localStorage.setItem(AUTH_REMEMBER_KEY, remember ? "true" : "false");

  const token = loginResponse ? extractAuthToken(loginResponse) : null;
  const user = loginResponse ? extractAuthUser(loginResponse) : null;

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizeAuthUser(user)));
  }

  recordAuthLoginTime();
  touchAuthActivity(remember);
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

export function recordAuthLoginTime() {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_LAST_LOGIN_KEY, String(Date.now()));
}

export function getLastLoginMs(): number | null {
  if (typeof window === "undefined") return null;
  const parsed = Number(localStorage.getItem(AUTH_LAST_LOGIN_KEY));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function persistAuthUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizeAuthUser(user)));
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeAuthUser(parsed);
  } catch {
    return null;
  }
}

export function getLastActivityMs(): number {
  if (typeof window === "undefined") return 0;
  return parseLastActivity(localStorage.getItem(AUTH_LAST_ACTIVITY_KEY));
}

export function getLastLoginLabel(): string {
  const loginMs = getLastLoginMs();
  const activityMs = getLastActivityMs();
  const timestamp = loginMs ?? (activityMs > 0 ? activityMs : null);
  return timestamp ? formatLastLoginLabel(timestamp) : "Not available";
}

export function getSessionExpiresInLabel(): string {
  return formatSessionExpiresIn(getLastActivityMs(), AUTH_IDLE_MS);
}

export function isAuthenticatedClient(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(AUTH_STORAGE_KEY) !== "true") return false;

  const lastActivity = getLastActivityMs();
  if (isAuthIdleExpired(lastActivity)) return false;

  return true;
}

export function clearAuthentication() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);

  clearClientCookie(AUTH_COOKIE);
  clearClientCookie(AUTH_LAST_ACTIVITY_COOKIE);
  clearClientCookie(HUB_SESSION_COOKIE);
  clearClientCookie(AUTH_REMEMBER_COOKIE);
  clearAuthCredentials();
}

export function getDisplayName(user: AuthUser | null): string | null {
  if (!user) return null;
  if (typeof user.name === "string" && user.name.trim()) {
    return user.name.trim();
  }
  if (typeof user.username === "string" && user.username.trim()) {
    return user.username.trim();
  }
  if (typeof user.phone_no === "string" && user.phone_no.trim()) {
    return user.phone_no.trim();
  }
  return null;
}

export function getAuthCompanyName(user: AuthUser | null): string | null {
  if (!user) return null;
  if (typeof user.company_name === "string" && user.company_name.trim()) {
    return user.company_name.trim();
  }
  if (typeof user.company === "string" && user.company.trim()) {
    return user.company.trim();
  }
  return null;
}

export const PENDING_PASSWORD_RESET_COOKIE = "zl-pending-password-reset";
export const PENDING_RESET_TOKEN_COOKIE = "zl-pending-reset-token";
export const PENDING_RESET_FLOW_COOKIE = "zl-pending-reset-flow";
/** Set after hub password reset completes; iWaste flags may stay stale. */
export const HUB_PASSWORD_SETUP_COOKIE = "zl-hub-password-setup";

export function attachHubSessionCookies(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options?: { path?: string; sameSite?: "lax"; maxAge?: number }
    ) => void;
  };
}) {
  const now = String(Date.now());
  const maxAge = REMEMBER_COOKIE_MAX_AGE;
  response.cookies.set(AUTH_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge,
  });
  response.cookies.set(AUTH_LAST_ACTIVITY_COOKIE, now, {
    path: "/",
    sameSite: "lax",
    maxAge,
  });
  response.cookies.set(HUB_SESSION_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge,
  });
}

/** Cookie flags for clearing auth in middleware responses */
export const AUTH_CLEAR_COOKIES = [
  AUTH_COOKIE,
  AUTH_LAST_ACTIVITY_COOKIE,
  AUTH_REMEMBER_COOKIE,
  HUB_SESSION_COOKIE,
  PENDING_PASSWORD_RESET_COOKIE,
  PENDING_RESET_TOKEN_COOKIE,
  PENDING_RESET_FLOW_COOKIE,
] as const;
