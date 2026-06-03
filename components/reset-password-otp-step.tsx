"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { OtpInput, OTP_LENGTH } from "@/components/otp-input";
import {
  ResetPasswordShell,
  getErrorMessage,
  postResetJson,
  resetButtonClass,
} from "@/components/reset-password-shell";
import {
  getResetPhone,
  isFirstLoginReset,
  markResetOtpVerified,
  saveResetPhone,
} from "@/lib/reset-password-session";

export function ResetPasswordOtpStep() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hideBackLink, setHideBackLink] = useState(false);

  useEffect(() => {
    setHideBackLink(isFirstLoginReset());
  }, []);

  useEffect(() => {
    const stored = getResetPhone();
    if (!stored) {
      router.replace("/reset-password");
      return;
    }
    setPhone(stored);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length < OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    setSubmitting(true);

    try {
      const { ok, payload } = await postResetJson<{ message?: string }>(
        "/api/auth/reset/verify",
        { phone_no: phone, otp: trimmedOtp }
      );

      if (!ok) {
        setError(getErrorMessage(payload, "Invalid verification code."));
        return;
      }

      saveResetPhone(phone);
      markResetOtpVerified();
      router.push("/reset-password/new-password");
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
      step={2}
      title="We just sent an SMS"
      description="Enter the security code we sent to"
      hideBackLink={hideBackLink}
      centered
    >
      <div className="mb-6 flex items-center justify-center gap-2">
        <p className="text-base font-medium text-primary">{phone}</p>
        {!hideBackLink && (
          <Link
            href="/reset-password"
            className="inline-flex rounded-md p-1 text-brand-700 transition hover:bg-brand-50 hover:text-brand-800 dark:text-brand-400 dark:hover:bg-brand-950/50"
            aria-label="Change phone number"
          >
            <PencilSquareIcon className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <p id="reset-otp-label" className="sr-only">
            Verification code
          </p>
          <OtpInput
            id="reset-otp"
            value={otp}
            onChange={setOtp}
            disabled={submitting}
          />
        </div>

        <button type="submit" disabled={submitting} className={resetButtonClass}>
          {submitting ? "Verifying…" : "Verify"}
        </button>

        {!hideBackLink && (
          <Link
            href="/reset-password"
            className="block text-center text-sm font-medium text-primary-muted transition hover:text-primary"
          >
            Use a different phone number
          </Link>
        )}
      </form>
    </ResetPasswordShell>
  );
}
