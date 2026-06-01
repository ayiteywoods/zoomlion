import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type SystemPlaceholderProps = {
  title: string;
  description: string;
};

export function SystemPlaceholder({ title, description }: SystemPlaceholderProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-line bg-brand-950 px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/10 transition-colors hover:bg-white/15"
            aria-label="Back to dashboard"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <p className="text-sm text-on-brand-muted">Zoomlion Ghana</p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-12 lg:px-8">
        <div className="rounded-xl border border-line bg-surface-elevated p-8 shadow-sm">
          <p className="text-sm leading-7 text-muted">{description}</p>
          <p className="mt-4 text-sm text-muted">
            This module will connect to your production application. Use the
            dashboard to return home.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
