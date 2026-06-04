import {
  extractAuthToken,
  extractAuthUser,
  fetchUserProfile,
  getAuthApiBaseUrl,
  getLoginErrorMessage,
  type LoginResult,
  type LoginSuccessResponse,
} from "@/lib/auth-api";

export const AUTH_CONSOLIDATED_PATHS = ["/auth/user", "/auth/"] as const;
export const ACCOUNT_NOT_FOUND_MESSAGE =
  "This Consolidated Account does not exist, Please contact System Administrator";

const PASSWORD_RESET_MESSAGE_HINTS = [
  "change your password",
  "change password",
  "reset your password",
  "reset password",
  "first login",
  "first time",
  "set a new password",
  "update your password",
  "password expired",
  "temporary password",
  "default password",
];

function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "first_login" ||
      normalized === "pending" ||
      normalized === "required"
    );
  }
  return false;
}

function isExplicitlyNotFirstLogin(value: unknown): boolean {
  return value === false || value === 0 || value === "0" || value === "false";
}

function parsePasswordResetFlag(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "N" || normalized === "NO" || normalized === "FALSE") {
      return true;
    }
    if (normalized === "Y" || normalized === "YES" || normalized === "TRUE") {
      return false;
    }
  }

  if (value === false || value === 0) return true;
  if (value === true || value === 1) return false;

  return null;
}

function getFlagFromPayload(
  payload: LoginSuccessResponse,
  field: "password_reset" | "is_sso"
): boolean | null {
  const record = payload as Record<string, unknown>;
  const user = extractAuthUser(payload) as Record<string, unknown> | null;

  if (user && field in user) {
    const parsed = parsePasswordResetFlag(user[field]);
    if (parsed !== null) return parsed;
  }

  if (field in record) {
    const parsed = parsePasswordResetFlag(record[field]);
    if (parsed !== null) return parsed;
  }

  return null;
}

/** iWaste: password_reset "N" — used by the forgot-password flow only, not normal login. */
export function isPasswordResetRequired(
  payload: LoginSuccessResponse
): boolean {
  return getFlagFromPayload(payload, "password_reset") === true;
}

/** iWaste: is_sso "N" = first-time consolidated sign-in setup. */
export function isSsoFirstTimeLogin(payload: LoginSuccessResponse): boolean {
  return getFlagFromPayload(payload, "is_sso") === true;
}

function messageRequiresPasswordReset(payload: LoginSuccessResponse): boolean {
  const record = payload as Record<string, unknown>;
  const parts = [
    typeof record.message === "string" ? record.message : "",
    typeof record.status === "string" ? record.status : "",
    typeof record.code === "string" ? record.code : "",
  ]
    .join(" ")
    .toLowerCase();

  return PASSWORD_RESET_MESSAGE_HINTS.some((hint) => parts.includes(hint));
}

function scanObjectForFirstLogin(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): boolean {
  if (depth > 6 || value === null || value === undefined) return false;

  if (typeof value === "object") {
    if (seen.has(value as object)) return false;
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.some((item) => scanObjectForFirstLogin(item, depth + 1, seen));
    }

    const record = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(record)) {
      const keyLower = key.toLowerCase();

      if (isExplicitlyNotFirstLogin(val)) {
        continue;
      }

      if (keyLower === "password_reset" || keyLower === "is_sso") {
        continue;
      }

      if (
        keyLower === "first_login" ||
        keyLower === "is_first_login" ||
        keyLower === "first_time_login" ||
        keyLower === "must_reset_password" ||
        keyLower === "must_change_password" ||
        keyLower === "force_password_change" ||
        keyLower === "password_reset_required" ||
        keyLower === "requires_password_reset" ||
        keyLower === "require_password_reset" ||
        keyLower === "is_new_user" ||
        keyLower === "new_user" ||
        keyLower === "reset_password" ||
        keyLower === "change_password" ||
        keyLower === "is_default_password" ||
        keyLower === "default_password" ||
        keyLower === "is_password_set" ||
        keyLower === "password_set" ||
        keyLower === "has_changed_password"
      ) {
        if (keyLower === "is_password_set" || keyLower === "password_set") {
          if (val === false || val === 0 || val === "0") return true;
          continue;
        }
        if (keyLower === "has_changed_password") {
          if (val === false || val === 0 || val === "0") return true;
          continue;
        }
        if (isTruthyFlag(val)) return true;
      }

      if (keyLower === "login_count" && (val === 0 || val === "0")) {
        return true;
      }

      if (
        keyLower === "status" &&
        typeof val === "string" &&
        ["pending", "inactive", "first_login", "new"].includes(
          val.toLowerCase()
        )
      ) {
        return true;
      }

      if (scanObjectForFirstLogin(val, depth + 1, seen)) {
        return true;
      }
    }
  }

  return false;
}

/** @deprecated Use isSsoFirstTimeLogin or isPasswordResetRequired explicitly. */
export function isFirstTimeLogin(payload: LoginSuccessResponse): boolean {
  return isSsoFirstTimeLogin(payload);
}

export function isConsolidatedAccountNotFound(
  status: number,
  payload: unknown
): boolean {
  if (status === 404) {
    const message = getLoginErrorMessage(payload, "").toLowerCase();
    // Laravel "route not found" is not the same as user not found.
    if (message.includes("route") && message.includes("could not be found")) {
      return false;
    }
    return true;
  }

  const message = getLoginErrorMessage(payload, "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("do not exist") ||
    message.includes("not exist") ||
    message.includes("not found") ||
    message.includes("no account") ||
    message.includes("unknown user")
  );
}

function getConsolidatedAuthUrls(): string[] {
  const base = getAuthApiBaseUrl().replace(/\/$/, "");
  return AUTH_CONSOLIDATED_PATHS.map((path) => `${base}${path}`);
}

async function postConsolidatedAuth(
  url: string,
  phoneNo: string,
  password: string
): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const form = new FormData();
  form.append("phone_no", phoneNo);
  form.append("password", password);

  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });

  const payload: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

export type LoginResetRedirect = "none" | "first-time";

async function resolveLoginResetRedirect(
  data: LoginSuccessResponse,
  options?: { hubSetupComplete?: boolean }
): Promise<LoginResetRedirect> {
  if (options?.hubSetupComplete) {
    return "none";
  }

  const token = extractAuthToken(data);
  let profileData: LoginSuccessResponse | null = null;
  if (token) {
    const profile = await fetchUserProfile(token);
    if (profile.ok) {
      profileData = profile.data;
    }
  }

  const payload = profileData ?? data;

  if (isSsoFirstTimeLogin(payload)) {
    return "first-time";
  }

  return "none";
}

export type ConsolidatedLoginResult =
  | {
      ok: true;
      data: LoginSuccessResponse;
      resetRedirect: LoginResetRedirect;
      phoneNo: string;
    }
  | {
      ok: false;
      message: string;
      status: number;
      accountNotFound?: boolean;
    };

export async function loginConsolidatedAuth(
  phoneNo: string,
  password: string,
  options?: { skipResetRedirect?: boolean; hubSetupComplete?: boolean }
): Promise<ConsolidatedLoginResult> {
  const trimmedPhone = phoneNo.trim();

  try {
    let lastFailure: ConsolidatedLoginResult | null = null;

    for (const url of getConsolidatedAuthUrls()) {
      const { ok, status, payload } = await postConsolidatedAuth(
        url,
        trimmedPhone,
        password
      );

      if (!ok) {
        const routeMissing =
          status === 404 &&
          getLoginErrorMessage(payload, "")
            .toLowerCase()
            .includes("route") &&
          getLoginErrorMessage(payload, "")
            .toLowerCase()
            .includes("could not be found");

        if (routeMissing) {
          continue;
        }

        lastFailure = {
          ok: false,
          status: 404,
          accountNotFound: true,
          message: ACCOUNT_NOT_FOUND_MESSAGE,
        };
        continue;
      }

      const data = (payload ?? {}) as LoginSuccessResponse;
      const user = extractAuthUser(data);
      const resolvedPhone = user?.phone_no?.trim() || trimmedPhone;
      const resetRedirect = options?.skipResetRedirect
        ? ("none" as const)
        : await resolveLoginResetRedirect(data, {
            hubSetupComplete: options?.hubSetupComplete,
          });

      return {
        ok: true,
        data,
        resetRedirect,
        phoneNo: resolvedPhone,
      };
    }

    if (lastFailure) return lastFailure;

    return {
      ok: false,
      status: 404,
      accountNotFound: true,
      message: ACCOUNT_NOT_FOUND_MESSAGE,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

export function toLoginResult(
  result: ConsolidatedLoginResult
): LoginResult | null {
  if (!result.ok) return result;
  return { ok: true, data: result.data };
}
