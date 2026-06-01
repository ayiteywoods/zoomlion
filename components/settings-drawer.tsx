"use client";

import { useEffect } from "react";
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "@/components/dashboard-provider";
import {
  brandThemes,
  themeModeOptions,
  type BrandThemeId,
  type ThemeMode,
} from "@/lib/theme-settings";
import { roleDescriptions, roleLabels, type UserRole } from "@/lib/permissions";

const demoRoles: UserRole[] = [
  "operations-manager",
  "field-supervisor",
  "corporate-admin",
  "platform-admin",
];

const modeIcons: Record<ThemeMode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};

export function SettingsDrawer() {
  const {
    settingsOpen,
    setSettingsOpen,
    themeMode,
    brandTheme,
    resolvedDark,
    setThemeMode,
    setBrandTheme,
    role,
    setRole,
    setShortcutsOpen,
  } = useDashboard();

  useEffect(() => {
    if (!settingsOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[120]" role="presentation">
      <button
        type="button"
        className="animate-backdrop-in absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={() => setSettingsOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="animate-drawer-in absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-line bg-surface-elevated shadow-[-8px_0_32px_rgba(0,0,0,0.12)]"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Settings</h2>
            <p className="text-xs text-muted">Appearance & preferences</p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Close settings"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <section className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Appearance mode
            </h3>
            <p className="mt-1 text-xs text-muted">
              {resolvedDark ? "Dark mode is active" : "Light mode is active"}
              {themeMode === "system" ? " (from device)" : ""}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {themeModeOptions.map((option) => {
                const Icon = modeIcons[option.id];
                const selected = themeMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setThemeMode(option.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-all ${
                      selected
                        ? "border-brand-700 bg-primary-soft ring-2 ring-brand-700/30"
                        : "border-line bg-surface hover:border-brand-800/40 hover:bg-primary-soft/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${selected ? "text-primary-muted" : "text-muted"}`}
                    />
                    <span
                      className={`text-xs font-medium ${selected ? "text-primary" : "text-muted"}`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Theme color
            </h3>
            <p className="mt-1 text-xs text-muted">
              Updates header, footer, and accents
            </p>
            <div className="mt-3 space-y-2">
              {brandThemes.map((brand) => {
                const selected = brandTheme === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setBrandTheme(brand.id as BrandThemeId)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      selected
                        ? "border-brand-700 bg-primary-soft ring-2 ring-brand-700/25"
                        : "border-line hover:bg-primary-soft/50"
                    }`}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: brand.swatch }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-primary">
                        {brand.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {brand.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Demo role
            </h3>
            <p className="mt-1 text-xs text-muted">
              Controls which systems appear on the dashboard
            </p>
            <div className="mt-3 space-y-1.5">
              {demoRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    role === r
                      ? "bg-primary-soft font-semibold text-primary ring-1 ring-line"
                      : "text-muted hover:bg-primary-soft/60"
                  }`}
                >
                  <span className="block font-medium text-primary">
                    {roleLabels[r]}
                  </span>
                  <span className="block text-[10px] leading-4 text-muted">
                    {roleDescriptions[r]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Shortcuts
            </h3>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setShortcutsOpen(true);
              }}
              className="mt-3 w-full rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
            >
              View keyboard shortcuts
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Press <kbd className="rounded border border-line bg-surface px-1">?</kbd> anytime
              </span>
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
