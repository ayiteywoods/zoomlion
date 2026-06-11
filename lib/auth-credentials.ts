export const AUTH_CREDENTIALS_KEY = "zl-auth-credentials";

export type StoredAuthCredentials = {
  phone: string;
  password: string;
  /** Preferred username for Corporate web (often email from API profile) */
  corporateLoginId?: string;
  /** Optional SIP login override (email or phone) */
  sipEmail?: string;
};

export function resolveSipLoginId(
  credentials: StoredAuthCredentials
): string | null {
  if (credentials.sipEmail?.trim()) {
    return credentials.sipEmail.trim();
  }
  if (credentials.corporateLoginId?.trim()) {
    return credentials.corporateLoginId.trim();
  }
  if (credentials.phone.trim()) {
    return credentials.phone.trim();
  }
  return null;
}

/** @deprecated Use resolveSipLoginId */
export const resolveSipEmail = resolveSipLoginId;

export function saveAuthCredentials(
  phone: string,
  password: string,
  corporateLoginId?: string,
  sipEmail?: string
) {
  if (typeof window === "undefined") return;

  const payload: StoredAuthCredentials = {
    phone: phone.trim(),
    password,
    corporateLoginId: corporateLoginId?.trim() || undefined,
    sipEmail: sipEmail?.trim() || undefined,
  };

  const serialized = JSON.stringify(payload);
  sessionStorage.setItem(AUTH_CREDENTIALS_KEY, serialized);
  localStorage.setItem(AUTH_CREDENTIALS_KEY, serialized);
}

export function getAuthCredentials(): StoredAuthCredentials | null {
  if (typeof window === "undefined") return null;

  const raw =
    localStorage.getItem(AUTH_CREDENTIALS_KEY) ??
    sessionStorage.getItem(AUTH_CREDENTIALS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthCredentials;
    if (
      typeof parsed.phone === "string" &&
      parsed.phone.trim() &&
      typeof parsed.password === "string" &&
      parsed.password
    ) {
      return {
        phone: parsed.phone.trim(),
        password: parsed.password,
        corporateLoginId:
          typeof parsed.corporateLoginId === "string"
            ? parsed.corporateLoginId.trim() || undefined
            : undefined,
        sipEmail:
          typeof parsed.sipEmail === "string"
            ? parsed.sipEmail.trim() || undefined
            : undefined,
      };
    }
  } catch {
    // ignore malformed storage
  }

  return null;
}

export function clearAuthCredentials() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_CREDENTIALS_KEY);
  localStorage.removeItem(AUTH_CREDENTIALS_KEY);
}
