"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "@/components/dashboard-provider";

export function FloatingSettingsButton() {
  const { settingsOpen, setSettingsOpen } = useDashboard();

  return (
    <button
      type="button"
      onClick={() => setSettingsOpen(!settingsOpen)}
      aria-expanded={settingsOpen}
      aria-label={settingsOpen ? "Close settings" : "Open settings"}
      className={`animate-settings-float fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-brand-950 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] ring-4 ring-white/90 transition-transform duration-300 hover:scale-105 active:scale-95 dark:ring-brand-900/80 ${
        settingsOpen ? "scale-105 ring-brand-300/50" : ""
      }`}
    >
      <Cog6ToothIcon
        className={`h-7 w-7 transition-transform duration-500 ${settingsOpen ? "rotate-90" : "animate-spin-slow"}`}
      />
    </button>
  );
}
