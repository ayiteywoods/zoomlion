export const RESET_PHONE_KEY = "zl-reset-phone";
export const RESET_OTP_VERIFIED_KEY = "zl-reset-otp-verified";
export const RESET_FIRST_LOGIN_KEY = "zl-reset-first-login";

export function saveResetPhone(phone: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESET_PHONE_KEY, phone.trim());
}

export function markFirstLoginReset() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESET_FIRST_LOGIN_KEY, "1");
}

export function isFirstLoginReset(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RESET_FIRST_LOGIN_KEY) === "1";
}

export function getResetPhone(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(RESET_PHONE_KEY)?.trim() ?? "";
}

export function markResetOtpVerified() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESET_OTP_VERIFIED_KEY, "1");
}

export function isResetOtpVerified(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RESET_OTP_VERIFIED_KEY) === "1";
}

export function clearResetSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RESET_PHONE_KEY);
  sessionStorage.removeItem(RESET_OTP_VERIFIED_KEY);
  sessionStorage.removeItem(RESET_FIRST_LOGIN_KEY);
}
