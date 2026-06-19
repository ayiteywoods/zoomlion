const DEFAULT_IWASTE_API_BASE = "https://iwaste.adudor.com/api";
const DEFAULT_CORPORATE_ORIGIN = "https://corporate.adudor.com";
const DEFAULT_CORPORATE_LOGIN_URL = `${DEFAULT_CORPORATE_ORIGIN}/api/login`;
import { loginSipWebSession, SIP_API_BASE } from "@/lib/sip-web-auth";
import {
  buildHubLoginFailure,
  type HubSystemId,
  type LoginErrorCode,
  type SystemLoginAttempt,
  toSystemLoginAttempt,
} from "@/lib/login-error-messages";

export const AUTH_LOGIN_PATH = "/auth/user";
export const AUTH_PROFILE_PATH = "/profile";

export function getAuthApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_IWASTE_API_URL ??
    process.env.IWASTE_API_URL ??
    DEFAULT_IWASTE_API_BASE
  );
}

export function getCorporateLoginUrl(): string {
  return (
    process.env.CORPORATE_LOGIN_URL ??
    process.env.NEXT_PUBLIC_CORPORATE_LOGIN_URL ??
    DEFAULT_CORPORATE_LOGIN_URL
  );
}

export function getCorporateApiUserUrl(): string {
  const base =
    process.env.CORPORATE_API_URL ??
    process.env.NEXT_PUBLIC_CORPORATE_API_URL ??
    `${DEFAULT_CORPORATE_ORIGIN}/api`;
  return `${base.replace(/\/$/, "")}/user`;
}

export function getSipLoginApiUrl(): string {
  const base =
    process.env.SIP_API_URL ??
    process.env.NEXT_PUBLIC_SIP_API_URL ??
    SIP_API_BASE;
  return `${base.replace(/\/$/, "")}/login`;
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

export function getAuthLoginUrl(): string {
  return `${getAuthApiBaseUrl()}${AUTH_LOGIN_PATH}`;
}

export type AuthUser = {
  id?: string | number;
  name?: string;
  username?: string;
  phone_no?: string;
  email?: string;
  role?: string;
  type?: string;
  company?: string;
  company_name?: string;
  /** iWaste: "N" = must reset password, "Y" = already reset */
  password_reset?: string;
  /** iWaste: "N" = first-time consolidated sign-in, "Y" = already set up */
  is_sso?: string;
  [key: string]: unknown;
};

export type LoginSuccessResponse = {
  message?: string;
  token?: string;
  access_token?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    access_token?: string;
    user?: AuthUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type LoginResult =
  | { ok: true; data: LoginSuccessResponse }
  | { ok: false; message: string; status: number };

export type HubLoginDetailedResult =
  | {
      ok: true;
      data: LoginSuccessResponse;
      system: HubSystemId;
      attempts: SystemLoginAttempt[];
    }
  | {
      ok: false;
      message: string;
      status: number;
      code: LoginErrorCode;
      attempts: SystemLoginAttempt[];
    };

function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function isUserLike(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    "name" in record ||
    "phone_no" in record ||
    "phone" in record ||
    "username" in record ||
    "id" in record ||
    "user_id" in record
  );
}

export function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
  const id = raw.id ?? raw.user_id;

  return {
    ...raw,
    id:
      typeof id === "string" || typeof id === "number" ? id : undefined,
    name: pickString(raw, "name", "full_name", "fullname"),
    username: pickString(raw, "username", "user_name", "login"),
    phone_no: pickString(raw, "phone_no", "phone", "phone_number", "mobile"),
    email: pickString(raw, "email"),
    role: pickString(raw, "role", "user_role", "position"),
    type: pickString(raw, "type", "user_type"),
    company: pickString(raw, "company", "company_name", "organization"),
    company_name: pickString(raw, "company_name", "company", "organization"),
  };
}

export function extractAuthToken(data: LoginSuccessResponse): string | null {
  const record = data as Record<string, unknown>;

  if (typeof data.token === "string" && data.token) return data.token;
  if (typeof data.access_token === "string" && data.access_token) {
    return data.access_token;
  }

  const authorisation = record.authorisation;
  if (authorisation && typeof authorisation === "object") {
    const token = (authorisation as Record<string, unknown>).token;
    if (typeof token === "string" && token) return token;
  }

  if (data.data && typeof data.data === "object") {
    const nested = data.data as Record<string, unknown>;
    if (typeof nested.token === "string" && nested.token) return nested.token;
    if (typeof nested.access_token === "string" && nested.access_token) {
      return nested.access_token;
    }
  }

  const meta = record.meta;
  if (meta && typeof meta === "object") {
    const metaToken = (meta as Record<string, unknown>).token;
    if (typeof metaToken === "string" && metaToken) return metaToken;
  }

  if (typeof record.token === "string" && record.token) return record.token;

  return null;
}

export function extractAuthUser(data: LoginSuccessResponse): AuthUser | null {
  const record = data as Record<string, unknown>;
  const candidates: unknown[] = [
    record.user,
    record.data &&
      typeof record.data === "object" &&
      (record.data as Record<string, unknown>).user,
    record.data,
    record.result &&
      typeof record.result === "object" &&
      (record.result as Record<string, unknown>).user,
    record.result,
    isUserLike(record) ? record : null,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }

    const normalized = normalizeAuthUser(candidate as Record<string, unknown>);
    if (
      normalized.name ||
      normalized.username ||
      normalized.phone_no ||
      normalized.id
    ) {
      return normalized;
    }
  }

  return null;
}

/** iWaste may return this when the user exists but has no linked customer record. */
export function isNonFatalProfileMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("customer not found") || lower.includes("no customer");
}

export function getLoginErrorMessage(
  payload: unknown,
  fallback = "Unable to sign in. Please check your credentials."
): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }
  return fallback;
}

export function getAuthProfileUrl(): string {
  return `${getAuthApiBaseUrl()}${AUTH_PROFILE_PATH}`;
}

export type ProfileResult =
  | { ok: true; data: LoginSuccessResponse }
  | { ok: false; message: string; status: number };

export function extractUserFromPayload(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  return extractAuthUser(payload as LoginSuccessResponse);
}

async function fetchIwasteUserProfile(token: string): Promise<ProfileResult> {
  try {
    const response = await fetch(getAuthProfileUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const payload: unknown = await response.json().catch(() => null);
    const user = extractUserFromPayload(payload);

    if (!response.ok) {
      if (response.status === 401) {
        return {
          ok: false,
          status: 401,
          message: getLoginErrorMessage(
            payload,
            "Your session has expired. Please sign in again."
          ),
        };
      }

      const message = getLoginErrorMessage(payload, "Unable to load profile.");

      // Some profile responses include user data alongside a non-fatal message
      // (e.g. "Customer not found" when the user record exists but has no customer).
      if (user) {
        return {
          ok: true,
          data: (payload ?? {}) as LoginSuccessResponse,
        };
      }

      return {
        ok: false,
        status: response.status,
        message,
      };
    }

    return {
      ok: true,
      data: (payload ?? {}) as LoginSuccessResponse,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

async function fetchCorporateUserProfile(token: string): Promise<ProfileResult> {
  try {
    const response = await fetch(getCorporateApiUserUrl(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: getLoginErrorMessage(
          payload,
          "Unable to load profile from Corporate."
        ),
      };
    }

    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const nested =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : record;

    const user = normalizeAuthUser({
      ...nested,
      phone_no:
        pickString(nested, "phone_no", "phone", "phone_number", "mobile") ??
        undefined,
    });

    if (!user.name && !user.username && !user.phone_no && !user.id) {
      return {
        ok: false,
        status: 502,
        message: "Corporate returned an empty profile.",
      };
    }

    return {
      ok: true,
      data: { user, data: { user } },
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

/** Hub profile: iWaste first, then Corporate (hub login may use either token). */
export async function fetchUserProfile(token: string): Promise<ProfileResult> {
  const iwaste = await fetchIwasteUserProfile(token);
  if (iwaste.ok) return iwaste;

  const corporate = await fetchCorporateUserProfile(token);
  if (corporate.ok) return corporate;

  if (iwaste.status === 401 && corporate.status === 401) {
    return {
      ok: false,
      status: 401,
      message:
        corporate.message || iwaste.message || "Please sign in again.",
    };
  }

  return iwaste.status !== 0 ? iwaste : corporate;
}

export async function loginIwasteWithCredentials(
  phoneNo: string,
  password: string
): Promise<LoginResult> {
  const form = new FormData();
  form.append("phone_no", phoneNo.trim());
  form.append("password", password);

  try {
    const response = await fetch(getAuthLoginUrl(), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: getLoginErrorMessage(payload),
      };
    }

    return {
      ok: true,
      data: (payload ?? {}) as LoginSuccessResponse,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

export async function loginCorporateWithCredentials(
  username: string,
  password: string
): Promise<LoginResult> {
  const trimmedUsername = username.trim();

  try {
    const response = await fetch(getCorporateLoginUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: trimmedUsername,
        password,
      }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: getLoginErrorMessage(payload),
      };
    }

    const data = (payload ?? {}) as LoginSuccessResponse;

    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

export async function loginSipWithCredentials(
  loginId: string,
  password: string
): Promise<LoginResult> {
  const trimmedLoginId = loginId.trim();

  if (!trimmedLoginId) {
    return {
      ok: false,
      status: 400,
      message: "SIP sign-in requires an email address or phone number.",
    };
  }

  try {
    const response = await fetch(getSipLoginApiUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: trimmedLoginId,
        password,
      }),
    });

    if (response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      return {
        ok: true,
        data: (payload ?? {}) as LoginSuccessResponse,
      };
    }
  } catch {
    // API unreachable — fall through to web session login below
  }

  const webResult = await loginSipWebSession(trimmedLoginId, password);

  if (webResult.ok) {
    return {
      ok: true,
      data: {
        user: normalizeAuthUser({
          email: isEmailIdentifier(trimmedLoginId) ? trimmedLoginId : undefined,
          phone: isEmailIdentifier(trimmedLoginId) ? undefined : trimmedLoginId,
          username: trimmedLoginId,
        }),
      },
    };
  }

  return {
    ok: false,
    status: 401,
    message:
      webResult.message ??
      "Your credentials do not have access to SIP. Use your SIP email or phone and password.",
  };
}

/** Map upstream auth failures to a hub-friendly HTTP status (avoid 422 for wrong password). */
function hubLoginFailureStatus(upstreamStatus: number): number {
  if (upstreamStatus === 0) return 0;
  if (upstreamStatus === 401 || upstreamStatus === 403 || upstreamStatus === 404) {
    return 401;
  }
  if (upstreamStatus === 422) return 401;
  return upstreamStatus;
}

/**
 * Hub login with per-system attempts and classified error messages.
 * Phone → iWaste, Corporate, SIP. Email → SIP, Corporate, iWaste.
 */
export async function loginWithCredentialsDetailed(
  identifier: string,
  password: string
): Promise<HubLoginDetailedResult> {
  const trimmed = identifier.trim();
  const attempts: SystemLoginAttempt[] = [];
  const isEmail = isEmailIdentifier(trimmed);

  async function tryLogin(
    system: HubSystemId,
    loginFn: () => Promise<LoginResult>
  ): Promise<LoginSuccessResponse | null> {
    const result = await loginFn();
    attempts.push(toSystemLoginAttempt(system, result));
    return result.ok ? result.data : null;
  }

  if (isEmail) {
    const sip = await tryLogin("sip", () =>
      loginSipWithCredentials(trimmed, password)
    );
    if (sip) {
      return { ok: true, data: sip, system: "sip", attempts };
    }

    const corporate = await tryLogin("corporate", () =>
      loginCorporateWithCredentials(trimmed, password)
    );
    if (corporate) {
      return { ok: true, data: corporate, system: "corporate", attempts };
    }

    const iwaste = await tryLogin("iwaste", () =>
      loginIwasteWithCredentials(trimmed, password)
    );
    if (iwaste) {
      return { ok: true, data: iwaste, system: "iwaste", attempts };
    }
  } else {
    const iwaste = await tryLogin("iwaste", () =>
      loginIwasteWithCredentials(trimmed, password)
    );
    if (iwaste) {
      return { ok: true, data: iwaste, system: "iwaste", attempts };
    }

    const corporate = await tryLogin("corporate", () =>
      loginCorporateWithCredentials(trimmed, password)
    );
    if (corporate) {
      return { ok: true, data: corporate, system: "corporate", attempts };
    }

    const sip = await tryLogin("sip", () =>
      loginSipWithCredentials(trimmed, password)
    );
    if (sip) {
      return { ok: true, data: sip, system: "sip", attempts };
    }
  }

  const failure = buildHubLoginFailure(attempts);
  return {
    ok: false,
    message: failure.message,
    status: hubLoginFailureStatus(failure.status),
    code: failure.code,
    attempts,
  };
}

/**
 * Hub login: phone → iWaste, Corporate, SIP. Email → SIP, Corporate, iWaste.
 */
export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<LoginResult> {
  const result = await loginWithCredentialsDetailed(identifier, password);
  if (result.ok) {
    return { ok: true, data: result.data };
  }

  return {
    ok: false,
    status: result.status,
    message: result.message,
  };
}
