"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard-provider";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { SettingsDrawer } from "@/components/settings-drawer";
import { FloatingSettingsButton } from "@/components/floating-settings-button";
import { AuthActivityTracker } from "@/components/auth-activity-tracker";

const AUTH_ROUTES = ["/login", "/reset-password"];

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <DashboardProvider>
      <AuthActivityTracker />
      {children}
      {!isAuthRoute && (
        <>
          <FloatingSettingsButton />
          <SettingsDrawer />
          <KeyboardShortcutsDialog />
        </>
      )}
    </DashboardProvider>
  );
}
