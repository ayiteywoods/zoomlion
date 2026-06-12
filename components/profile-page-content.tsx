"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  extractUserFromPayload,
  isNonFatalProfileMessage,
  normalizeAuthUser,
  type AuthUser,
} from "@/lib/auth-api";
import {
  getAuthToken,
  getAuthUser,
  getDisplayName,
  hasAuthCookie,
  isAuthenticatedClient,
  persistAuthUser,
  touchAuthActivity,
} from "@/lib/auth";

const PROFILE_FIELD_ORDER: { key: keyof AuthUser | string; label: string }[] =
  [
    { key: "name", label: "Full name" },
    { key: "phone_no", label: "Phone number" },
    { key: "email", label: "Email" },
    { key: "username", label: "Username" },
    { key: "role", label: "Role" },
    { key: "company_name", label: "Company" },
    { key: "company", label: "Organization" },
  ];

const HIDDEN_PROFILE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "remember_token",
  "api_token",
  "message",
  "created_at",
  "updated_at",
  "deleted_at",
  "email_verified_at",
  "id",
  "user_id",
  "otp",
  "is_sso",
  "password_reset",
  "status",
  "usercode",
  "user_code",
  "updated_by",
]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return JSON.stringify(value);
}

function labelFromKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildProfileRows(user: AuthUser) {
  const used = new Set<string>();
  const rows: { label: string; value: string }[] = [];

  for (const field of PROFILE_FIELD_ORDER) {
    const value = user[field.key as keyof AuthUser];
    if (value === undefined || value === null || value === "") continue;
    rows.push({ label: field.label, value: formatValue(value) });
    used.add(String(field.key));
  }

  for (const [key, value] of Object.entries(user)) {
    const normalizedKey = key.toLowerCase().replace(/[\s-]+/g, "_");
    if (used.has(key) || HIDDEN_PROFILE_KEYS.has(key) || HIDDEN_PROFILE_KEYS.has(normalizedKey)) {
      continue;
    }
    if (key === "phone" && user.phone_no) continue;
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "object") continue;
    rows.push({ label: labelFromKey(key), value: formatValue(value) });
  }

  return rows;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfilePageContent() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileRequestIdRef = useRef(0);

  const loadProfile = useCallback(async () => {
    const requestId = ++profileRequestIdRef.current;
    const isLatestRequest = () => requestId === profileRequestIdRef.current;

    setLoading(true);
    setError(null);

    const token = getAuthToken();
    const cached = getAuthUser();

    if (!token) {
      if (cached) {
        setUser(cached);
        setLoading(false);
        return;
      }

      if (!isAuthenticatedClient() && !hasAuthCookie()) {
        router.replace("/login?from=/profile");
        return;
      }

      setLoading(false);
      setError(
        "Your hub session is active but profile details are unavailable. Sign out and sign in again to refresh."
      );
      return;
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload: unknown = await response.json().catch(() => null);
      const profileUser = extractUserFromPayload(payload);

      if (!isLatestRequest()) return;

      if (profileUser) {
        persistAuthUser(profileUser);
        setUser(profileUser);
        touchAuthActivity();
        setError(null);
      } else if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof (payload as { message: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Unable to load profile.";

        const userToKeep = cached ?? getAuthUser();
        if (userToKeep && isNonFatalProfileMessage(message)) {
          setUser(userToKeep);
          setError(null);
          return;
        }

        if (response.status === 401) {
          if (cached) {
            setUser(cached);
            setError(
              "Could not refresh your profile. Showing the details saved at sign-in."
            );
            return;
          }
          router.replace("/login?from=/profile");
          return;
        }

        if (userToKeep) {
          setUser(userToKeep);
        }
        setError(message);
      } else if (payload && typeof payload === "object") {
        setUser(normalizeAuthUser(payload as Record<string, unknown>));
        setError(null);
      }
    } catch {
      if (!isLatestRequest()) return;
      setError("Network error. Please check your connection and try again.");
    } finally {
      if (isLatestRequest()) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    setUser(getAuthUser());
    setMounted(true);
    void loadProfile();
  }, [loadProfile]);

  const displayName = mounted ? (getDisplayName(user) ?? "User") : "";
  const initials = displayName ? getInitials(displayName) : "";
  const rows = useMemo(() => (user ? buildProfileRows(user) : []), [user]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-muted transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface-elevated shadow-[0_1px_3px_rgba(23,37,84,0.06),0_8px_24px_rgba(23,37,84,0.06)]">
        <div className="border-b border-line bg-primary-soft/40 px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-950 text-2xl font-semibold text-white shadow-lg">
              {mounted && initials ? (
                initials
              ) : (
                <UserCircleIcon className="h-10 w-10" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Account profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary">
                {mounted && displayName ? (
                  displayName
                ) : (
                  <span
                    className="inline-block h-8 w-48 max-w-full animate-pulse rounded-md bg-line/80"
                    aria-hidden
                  />
                )}
              </h1>
              {mounted && user?.role && (
                <p className="mt-1 text-sm text-muted">{formatValue(user.role)}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
                {mounted && user?.phone_no && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <PhoneIcon className="h-4 w-4" aria-hidden />
                    {user.phone_no}
                  </span>
                )}
                {mounted && user?.email && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <EnvelopeIcon className="h-4 w-4" aria-hidden />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadProfile()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-elevated px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft disabled:opacity-60"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {loading && !user && (
            <div className="flex items-center justify-center py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-700" />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          {!loading && user && rows.length > 0 && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-line bg-surface/60 px-4 py-3.5"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-primary">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {!loading && !error && user && rows.length === 0 && (
            <p className="text-sm text-muted">No profile details were returned.</p>
          )}
        </div>
      </div>
    </div>
  );
}
