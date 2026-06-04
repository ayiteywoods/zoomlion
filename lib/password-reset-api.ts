import { getAuthApiBaseUrl, getLoginErrorMessage } from "@/lib/auth-api";

const DEFAULT_CORPORATE_ORIGIN = "https://corporate.adudor.com";
const DEFAULT_SIP_API_BASE = "http://sip.nerasolgh.com:8085/iwmis-pcm/api";

export const AUTH_RESET_PATH = "/auth/reset";
export const AUTH_RESET_VERIFY_PATHS = [
  "/auth/reset/verify",
  "/auth/verify",
  "/auth/otp/verify",
] as const;
export const AUTH_REFRESH_PATH = "/auth/refresh";

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^233/, "").replace(/^0/, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhoneDigits(a.trim());
  const right = normalizePhoneDigits(b.trim());
  if (!left || !right) return false;
  return left === right;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

export type ApiResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; status: number; code?: string };

export type MultiSystemResetResult = {
  ok: boolean;
  message: string;
  results: {
    iwaste: ApiResult;
    corporate: ApiResult;
    sip: ApiResult;
  };
};

function getCorporateResetPasswordUrl(): string {
  const base =
    process.env.CORPORATE_API_URL ??
    process.env.NEXT_PUBLIC_CORPORATE_API_URL ??
    `${DEFAULT_CORPORATE_ORIGIN}/api`;
  return `${base.replace(/\/$/, "")}/reset/password`;
}

function getSipResetPasswordUrl(): string {
  const base =
    process.env.SIP_API_URL ??
    process.env.NEXT_PUBLIC_SIP_API_URL ??
    DEFAULT_SIP_API_BASE;
  return `${base.replace(/\/$/, "")}/reset/password`;
}

function getAuthRefreshUrl(): string {
  return `${getAuthApiBaseUrl()}${AUTH_REFRESH_PATH}`;
}

async function postJson(
  url: string,
  body: Record<string, string>,
  token?: string
): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

async function postForm(
  url: string,
  fields: Record<string, string>,
  token?: string
): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });

  const payload: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

function mapUpstreamResetError(
  status: number,
  payload: unknown,
  fallback: string
): { status: number; message: string; code?: string } {
  const upstreamMessage = getLoginErrorMessage(payload, fallback);
  let code: string | undefined;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.code === "string" && record.code.trim()) {
      code = record.code.trim();
    }
  }

  return { status: status || 400, message: upstreamMessage, code };
}

export async function requestPasswordResetOtp(
  phoneNo: string,
  token?: string
): Promise<ApiResult> {
  const trimmed = phoneNo.trim();
  if (!trimmed) {
    return { ok: false, status: 400, message: "Phone number is required." };
  }

  try {
    const url = `${getAuthApiBaseUrl()}${AUTH_RESET_PATH}`;
    let result = await postForm(url, { phone_no: trimmed }, token);

    if (!result.ok && (result.status === 415 || result.status === 422)) {
      result = await postJson(url, { phone_no: trimmed }, token);
    }
    if (!result.ok && result.status === 422) {
      result = await postJson(url, { phone: trimmed }, token);
    }

    const { ok, status, payload } = result;

    if (!ok) {
      const mapped = mapUpstreamResetError(
        status,
        payload,
        "Unable to send verification code. Please try again."
      );
      return {
        ok: false,
        status: mapped.status,
        message: mapped.message,
        code: mapped.code,
      };
    }

    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : "Verification code sent to your phone.";

    return { ok: true, message };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

export async function verifyPasswordResetOtp(
  phoneNo: string,
  otp: string,
  token?: string
): Promise<ApiResult> {
  const trimmedPhone = phoneNo.trim();
  const trimmedOtp = otp.trim();

  if (!trimmedPhone) {
    return { ok: false, status: 400, message: "Phone number is required." };
  }
  if (!trimmedOtp) {
    return { ok: false, status: 400, message: "Verification code is required." };
  }

  const payloads: Record<string, string>[] = [
    { phone_no: trimmedPhone, otp: trimmedOtp },
    { phone_no: trimmedPhone, code: trimmedOtp },
    { phone: trimmedPhone, otp: trimmedOtp },
  ];

  try {
    for (const verifyPath of AUTH_RESET_VERIFY_PATHS) {
      for (const body of payloads) {
        const { ok, status, payload } = await postJson(
          `${getAuthApiBaseUrl()}${verifyPath}`,
          body,
          token
        );

        if (ok) {
          const record =
            payload && typeof payload === "object"
              ? (payload as Record<string, unknown>)
              : {};
          const message =
            typeof record.message === "string" && record.message.trim()
              ? record.message
              : "Verification code accepted.";

          return { ok: true, message };
        }

        if (status !== 404 && status !== 405) {
          return {
            ok: false,
            status,
            message: getLoginErrorMessage(
              payload,
              "Invalid verification code. Please try again."
            ),
          };
        }
      }
    }

    // Some backends verify OTP only when resetting password; allow flow to continue.
    const resetAttempt = await postForm(
      `${getAuthApiBaseUrl()}${AUTH_RESET_PATH}`,
      { phone_no: trimmedPhone, otp: trimmedOtp },
      token
    );

    if (resetAttempt.ok) {
      return { ok: true, message: "Verification code accepted." };
    }

    return {
      ok: false,
      status: resetAttempt.status || 401,
      message: getLoginErrorMessage(
        resetAttempt.payload,
        "Invalid verification code. Please try again."
      ),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error. Please check your connection and try again.",
    };
  }
}

async function resetIwastePassword(
  phoneNo: string,
  password: string,
  token?: string
): Promise<ApiResult> {
  try {
    const attempts = [
      () => postForm(getAuthRefreshUrl(), { phone_no: phoneNo, password }, token),
      () => postJson(getAuthRefreshUrl(), { phone_no: phoneNo, password }, token),
    ];

    for (const attempt of attempts) {
      const { ok, status, payload } = await attempt();
      if (ok) {
        return { ok: true, message: "iWaste password updated." };
      }
      if (status !== 404 && status !== 405 && status !== 415) {
        return {
          ok: false,
          status,
          message: getLoginErrorMessage(
            payload,
            "Unable to reset iWaste password."
          ),
        };
      }
    }

    return {
      ok: false,
      status: 502,
      message: "Unable to reset iWaste password.",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error while resetting iWaste password.",
    };
  }
}

async function resetCorporatePassword(
  phoneNo: string,
  password: string
): Promise<ApiResult> {
  try {
    const { ok, status, payload } = await postJson(getCorporateResetPasswordUrl(), {
      phone: phoneNo,
      password,
      password_confirmation: password,
    });

    if (!ok) {
      return {
        ok: false,
        status,
        message: getLoginErrorMessage(
          payload,
          "Unable to reset Corporate password."
        ),
      };
    }

    return { ok: true, message: "Corporate password updated." };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error while resetting Corporate password.",
    };
  }
}

async function resetSipPassword(
  phoneNo: string,
  password: string
): Promise<ApiResult> {
  try {
    const { ok, status, payload } = await postJson(getSipResetPasswordUrl(), {
      phone: phoneNo,
      password,
      password_confirmation: password,
    });

    if (!ok) {
      return {
        ok: false,
        status,
        message: getLoginErrorMessage(payload, "Unable to reset SIP password."),
      };
    }

    return { ok: true, message: "SIP password updated." };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error while resetting SIP password.",
    };
  }
}

export async function resetPasswordAllSystems(
  phoneNo: string,
  password: string,
  token?: string
): Promise<MultiSystemResetResult> {
  const trimmedPhone = phoneNo.trim();

  const [iwaste, corporate, sip] = await Promise.all([
    resetIwastePassword(trimmedPhone, password, token),
    resetCorporatePassword(trimmedPhone, password),
    resetSipPassword(trimmedPhone, password),
  ]);

  const failures = [iwaste, corporate, sip].filter((result) => !result.ok);

  if (failures.length === 0) {
    return {
      ok: true,
      message: "Password updated on iWaste, Corporate, and SIP.",
      results: { iwaste, corporate, sip },
    };
  }

  if (failures.length === 3) {
    return {
      ok: false,
      message: failures[0]?.message ?? "Unable to reset password.",
      results: { iwaste, corporate, sip },
    };
  }

  const failedLabels = [
    !iwaste.ok ? "iWaste" : null,
    !corporate.ok ? "Corporate" : null,
    !sip.ok ? "SIP" : null,
  ].filter(Boolean);

  return {
    ok: false,
    message: `Password updated on some systems, but failed on: ${failedLabels.join(", ")}.`,
    results: { iwaste, corporate, sip },
  };
}
