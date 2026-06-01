"use client";

import type { ReactNode } from "react";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type InlineAlertVariant = "error" | "warning" | "info";

const variantStyles: Record<
  InlineAlertVariant,
  {
    container: string;
    icon: string;
    title: string;
    body: string;
    dismiss: string;
  }
> = {
  error: {
    container:
      "border-rose-200/90 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40",
    icon: "text-rose-600 dark:text-rose-400",
    title: "text-rose-950 dark:text-rose-100",
    body: "text-rose-900/90 dark:text-rose-100/90",
    dismiss:
      "text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50",
  },
  warning: {
    container:
      "border-amber-200/90 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/50",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-950 dark:text-amber-100",
    body: "text-amber-900/90 dark:text-amber-100/90",
    dismiss:
      "text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50",
  },
  info: {
    container:
      "border-blue-200/90 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-950 dark:text-blue-100",
    body: "text-blue-900/90 dark:text-blue-100/90",
    dismiss:
      "text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50",
  },
};

const variantIcons = {
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const;

type InlineAlertProps = {
  variant?: InlineAlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

export function InlineAlert({
  variant = "info",
  title,
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  className = "",
}: InlineAlertProps) {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div
      role="alert"
      className={`relative shrink-0 rounded-xl border px-4 py-3 shadow-sm ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
          )}
          <p
            className={`text-sm leading-relaxed ${title ? "mt-1" : ""} ${styles.body}`}
          >
            {children}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${styles.dismiss}`}
            aria-label={dismissLabel}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
