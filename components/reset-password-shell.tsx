"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const resetFieldClass =
  "w-full rounded-lg border border-line bg-primary-soft py-3 pl-11 pr-4 text-[15px] text-primary outline-none transition duration-200 placeholder:text-muted focus:border-brand-600 focus:bg-blue-50 focus:ring-[3px] focus:ring-brand-600/15 dark:border-brand-800/55 dark:bg-brand-950/30 dark:focus:border-brand-500 dark:focus:ring-brand-500/20";

export const resetLabelClass =
  "mb-1.5 block text-sm font-medium text-primary";

export const resetButtonClass =
  "inline-flex w-full items-center justify-center rounded-lg bg-brand-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-wait disabled:opacity-70";

type ResetPasswordShellProps = {
  title: string;
  description: string;
  step: number;
  totalSteps?: number;
  hideBackLink?: boolean;
  centered?: boolean;
  children: ReactNode;
};

export function ResetPasswordShell({
  title,
  description,
  step,
  totalSteps = 3,
  hideBackLink = false,
  centered = false,
  children,
}: ResetPasswordShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated p-8 shadow-2xl ring-1 ring-line">
        <div
          className={
            centered
              ? "mb-6 flex flex-col items-center text-center"
              : "mb-6 flex items-center gap-3"
          }
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-primary-soft p-1.5">
            <Image
              src="/zl.png"
              alt="Zoomlion"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>
          <div className={centered ? "mt-3" : undefined}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Step {step} of {totalSteps}
            </p>
            <h1 className="text-xl font-semibold text-primary">{title}</h1>
          </div>
        </div>

        <p
          className={`mb-6 text-sm leading-6 text-muted${centered ? " text-center" : ""}`}
        >
          {description}
        </p>
        {children}

        {!hideBackLink && (
          <Link
            href="/login?cancelReset=1"
            className={`mt-6 inline-flex text-sm font-medium text-primary-muted transition hover:text-primary${centered ? " w-full justify-center" : ""}`}
          >
            Back to login
          </Link>
        )}
        {hideBackLink && (
          <Link
            href="/login?cancelReset=1"
            className={`mt-6 inline-flex text-sm font-medium text-primary-muted transition hover:text-primary${centered ? " w-full justify-center" : ""}`}
          >
            Sign in with a different account
          </Link>
        )}
      </div>
    </div>
  );
}

export async function postResetJson<T>(
  url: string,
  body: Record<string, string>
): Promise<{ ok: boolean; status: number; payload: T | null }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  const payload = (await response.json().catch(() => null)) as T | null;
  return { ok: response.ok, status: response.status, payload };
}

export function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message.trim()
        : "";
    const code =
      typeof record.code === "string" && record.code.trim()
        ? record.code.trim()
        : "";

    if (message && code) return `${message} (iWaste code: ${code})`;
    if (message) return message;
  }
  return fallback;
}
