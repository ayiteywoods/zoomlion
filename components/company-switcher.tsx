"use client";

import { useEffect, useRef, useState } from "react";
import {
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "@/components/dashboard-provider";
import { organizations } from "@/lib/dashboard-data";

export function CompanySwitcher({ compact = false }: { compact?: boolean }) {
  const { organizationId, organizationName, organizationRegion, setOrganizationId, roleLabel } =
    useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative hidden min-w-0 md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-10 max-w-[200px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-left transition-colors hover:bg-white/10 lg:max-w-[240px] ${
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5 lg:px-3"
        }`}
      >
        <BuildingOffice2Icon className="h-4 w-4 shrink-0 text-on-brand-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {organizationName}
          </p>
          {!compact && (
            <p className="truncate text-[10px] text-on-brand-muted">{roleLabel}</p>
          )}
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-on-brand-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface-elevated py-1 shadow-[0_12px_40px_rgba(23,37,84,0.15)] ring-1 ring-line"
        >
          <li className="border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Switch organization
          </li>
          {organizations.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                role="option"
                aria-selected={org.id === organizationId}
                onClick={() => {
                  setOrganizationId(org.id);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-primary-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-primary">
                    {org.name}
                  </span>
                  <span className="block text-xs text-muted">{org.region}</span>
                </span>
                {org.id === organizationId && (
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
