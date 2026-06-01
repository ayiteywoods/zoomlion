"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomSystemById, type CustomSystem } from "@/lib/custom-systems";

export function CustomSystemDetail({ systemId }: { systemId: string }) {
  const [system, setSystem] = useState<CustomSystem | null | undefined>(undefined);

  useEffect(() => {
    setSystem(getCustomSystemById(systemId) ?? null);
  }, [systemId]);

  if (system === undefined) {
    return (
      <div className="rounded-xl border border-line bg-surface-elevated p-6 text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!system) {
    return (
      <div className="rounded-xl border border-line bg-surface-elevated p-6">
        <h2 className="text-base font-semibold text-primary">System not found</h2>
        <p className="mt-2 text-sm text-muted">
          This system may have been removed from this browser.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex text-sm font-medium text-primary-muted transition hover:text-primary"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface-elevated p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {system.logoDataUrl && (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-line bg-primary-soft/30 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={system.logoDataUrl}
                alt={`${system.name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-muted">
              Custom system
            </p>
            <h2 className="mt-1 text-xl font-semibold text-primary">{system.name}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{system.description}</p>
            {system.url ? (
              <p className="mt-4 text-sm">
                <span className="font-medium text-primary">URL: </span>
                <a
                  href={system.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
                >
                  {system.url}
                </a>
              </p>
            ) : null}
            <p className="mt-4 text-xs text-muted">
              Added {new Date(system.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {system.url ? (
          <a
            href={system.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            Open system
          </a>
        ) : null}
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-primary-muted transition hover:text-primary"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
