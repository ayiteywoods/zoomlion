"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import {
  ResetPasswordShell,
  getErrorMessage,
  postResetJson,
  resetButtonClass,
  resetFieldClass,
  resetLabelClass,
} from "@/components/reset-password-shell";
import {
  getResetPhone,
  markFirstLoginReset,
  saveResetPhone,
} from "@/lib/reset-password-session";

export function ResetPasswordPhoneStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("phone")?.trim();
    const stored = getResetPhone();
    const resolved = fromQuery || stored || "";
    setPhone(resolved);
    if (resolved) saveResetPhone(resolved);
    if (searchParams.get("firstLogin") === "1") {
      markFirstLoginReset();
    }
  }, [searchParams]);

  const isFirstLogin = searchParams.get("firstLogin") === "1";
  const isForgotFlow = searchParams.get("flow") === "forgot";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Phone number is required.");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, string> = { phone_no: trimmed };
      if (isForgotFlow) body.flow = "forgot";

      const { ok, payload } = await postResetJson<{ message?: string }>(
        "/api/auth/reset",
        body
      );

      if (!ok) {
        setError(getErrorMessage(payload, "Unable to send verification code."));
        return;
      }

      saveResetPhone(trimmed);
      router.push("/reset-password/otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResetPasswordShell
      step={1}
      title="Reset password"
      hideBackLink={isFirstLogin}
      description={
        isFirstLogin
          ? "Welcome. Your consolidated account needs a new password. Enter your phone number to receive a verification code."
          : isForgotFlow
            ? "Forgot your password? Enter your phone number. We will send a verification code if your account requires a password reset."
            : "Enter the phone number linked to your consolidated account. We will send a verification code by SMS."
      }
    >
      {isFirstLogin && (
        <p className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:border-brand-800/50 dark:text-brand-100">
          First-time sign-in detected. Complete password setup to access the hub.
        </p>
      )}
      {isForgotFlow && !isFirstLogin && (
        <p className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:border-brand-800/50 dark:bg-brand-950/40 dark:text-brand-100">
          Forgot password. We will verify your account before sending a verification code.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="reset-phone" className={resetLabelClass}>
            Phone number
          </label>
          <div className="relative">
            <DevicePhoneMobileIcon
              className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="reset-phone"
              name="phone_no"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="e.g. 0248593031"
              className={resetFieldClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={submitting} className={resetButtonClass}>
          {submitting ? "Sending code…" : "Send verification code"}
        </button>
      </form>
    </ResetPasswordShell>
  );
}
