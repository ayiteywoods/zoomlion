import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated p-8 shadow-2xl ring-1 ring-line">
        <h1 className="text-xl font-semibold text-primary">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Password reset is not configured yet. Contact your administrator or
          return to login.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-300"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
