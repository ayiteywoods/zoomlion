"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  extractAuthUser,
  getLoginErrorMessage,
  type LoginSuccessResponse,
} from "@/lib/auth-api";
import { saveAuthCredentials } from "@/lib/auth-credentials";
import { setAuthenticated } from "@/lib/auth";
import {
  ResetPasswordShell,
  getErrorMessage,
  postResetJson,
  resetButtonClass,
  resetFieldClass,
  resetLabelClass,
} from "@/components/reset-password-shell";
import {
  clearResetSession,
  getResetPhone,
  isFirstLoginReset,
  isResetOtpVerified,
} from "@/lib/reset-password-session";

export function ResetPasswordNewPasswordStep() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hideBackLink, setHideBackLink] = useState(false);

  useEffect(() => {
    setHideBackLink(isFirstLoginReset());
  }, []);

  useEffect(() => {
    const storedPhone = getResetPhone();
    if (!storedPhone || !isResetOtpVerified()) {
      router.replace("/reset-password");
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { ok, payload } = await postResetJson<{ message?: string }>(
        "/api/auth/reset/complete",
        { phone_no: phone, password }
      );

      if (!ok) {
        setError(getErrorMessage(payload, "Unable to reset password."));
        return;
      }

      clearResetSession();
      setSuccess("Password updated. Signing you in…");

      const loginForm = new FormData();
      loginForm.append("phone_no", phone);
      loginForm.append("password", password);
      loginForm.append("post_reset", "1");

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        body: loginForm,
        credentials: "same-origin",
      });
      const loginPayload = (await loginResponse.json().catch(() => null)) as
        | (LoginSuccessResponse & {
            requiresFirstTimeSetup?: boolean;
          })
        | null;

      if (
        loginResponse.ok &&
        loginPayload &&
        !loginPayload.requiresFirstTimeSetup
      ) {
        const user = extractAuthUser(loginPayload);
        setAuthenticated(true, loginPayload);
        const profileEmail =
          user?.email?.trim() ||
          (user?.username?.includes("@") ? user.username.trim() : undefined);
        saveAuthCredentials(
          phone,
          password,
          profileEmail ?? user?.phone_no?.trim() ?? phone,
          profileEmail ?? (phone.includes("@") ? phone : undefined)
        );
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setError(
        getLoginErrorMessage(loginPayload) ??
          "Password updated, but sign-in failed. Please sign in manually."
      );
      setSuccess(null);
      window.setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!phone) {
    return null;
  }

  return (
    <ResetPasswordShell
      step={3}
      title="Set new password"
      description="Choose a new password. It will be updated on iWaste, PSL Corporate, and SIP."
      hideBackLink={hideBackLink}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </p>
        )}

        <div>
          <label htmlFor="new-password" className={resetLabelClass}>
            New password
          </label>
          <div className="relative">
            <LockClosedIcon
              className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              className={`${resetFieldClass} pr-11`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className={resetLabelClass}>
            Confirm password
          </label>
          <div className="relative">
            <LockClosedIcon
              className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              className={resetFieldClass}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={submitting || Boolean(success)} className={resetButtonClass}>
          {submitting ? "Updating password…" : "Update password on all systems"}
        </button>
      </form>
    </ResetPasswordShell>
  );
}
