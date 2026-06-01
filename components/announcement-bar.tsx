"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { dashboardAnnouncement } from "@/lib/dashboard-data";

const STORAGE_KEY = "zl-announcement-dismissed";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setVisible(dismissed !== dashboardAnnouncement.id);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, dashboardAnnouncement.id);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="animate-fade-in relative shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 lg:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 sm:items-center">
        <ExclamationTriangleIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 sm:mt-0"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-sm text-amber-950">
          <span className="font-medium">Attention: </span>
          {dashboardAnnouncement.message}{" "}
          <Link
            href={dashboardAnnouncement.href}
            className="font-semibold text-amber-900 underline decoration-amber-400/80 underline-offset-2 hover:text-amber-950"
          >
            {dashboardAnnouncement.linkLabel}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-700 transition-colors hover:bg-amber-100"
          aria-label="Dismiss announcement"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
