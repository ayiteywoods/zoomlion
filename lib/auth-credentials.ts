export const AUTH_CREDENTIALS_KEY = "zl-auth-credentials";

export type StoredAuthCredentials = {
  phone: string;
  password: string;
  /** Preferred username for Corporate web (often email from API profile) */
  corporateLoginId?: string;
  /** SIP API/web login (email) */
  sipEmail?: string;
};

export function resolveSipEmail(credentials: StoredAuthCredentials): string | null {
  if (credentials.sipEmail?.includes("@")) {
    return credentials.sipEmail.trim();
  }
  if (credentials.corporateLoginId?.includes("@")) {
    return credentials.corporateLoginId.trim();
  }
  if (credentials.phone.includes("@")) {
    return credentials.phone.trim();
  }
  return null;
}

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

  sessionStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(payload));

  console.info("[JGC Auth] Saved login credentials for system launch:", {
    phone: payload.phone,
    password: "[redacted]",
  });
}

export function getAuthCredentials(): StoredAuthCredentials | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(AUTH_CREDENTIALS_KEY);
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
}
