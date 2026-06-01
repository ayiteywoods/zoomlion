"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "@/components/dashboard-provider";

export function ThemeModeToggle({ className = "" }: { className?: string }) {
  const { resolvedDark, setThemeMode } = useDashboard();

  function toggle() {
    setThemeMode(resolvedDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95 ${className}`}
      aria-label={resolvedDark ? "Switch to light mode" : "Switch to dark mode"}
      title={resolvedDark ? "Light mode" : "Dark mode"}
    >
      {resolvedDark ? (
        <SunIcon className="h-5 w-5" aria-hidden />
      ) : (
        <MoonIcon className="h-5 w-5 animate-moon-rock" aria-hidden />
      )}
    </button>
  );
}
