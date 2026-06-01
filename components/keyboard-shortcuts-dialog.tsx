"use client";

import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "@/components/dashboard-provider";
import { keyboardShortcuts } from "@/lib/dashboard-data";

export function KeyboardShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useDashboard();

  useEffect(() => {
    if (!shortcutsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShortcutsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutsOpen, setShortcutsOpen]);

  if (!shortcutsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => setShortcutsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="animate-scale-in w-full max-w-md rounded-xl border border-line bg-surface-elevated p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setShortcutsOpen(false)}
            className="rounded-lg p-1 text-muted hover:bg-primary-soft"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-2">
          {keyboardShortcuts.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted">{shortcut.description}</span>
              <span className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-line bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
