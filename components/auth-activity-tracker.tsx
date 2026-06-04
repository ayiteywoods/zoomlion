"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthentication,
  getLastActivityMs,
  hasAuthCookie,
  isAuthIdleExpired,
  isAuthenticatedClient,
  touchAuthActivity,
} from "@/lib/auth";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

const THROTTLE_MS = 60_000;

export function AuthActivityTracker() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTouchRef = useRef(0);

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/reset-password")) {
      return;
    }

    if (!isAuthenticatedClient() && !hasAuthCookie()) {
      router.replace(
        `/login?from=${encodeURIComponent(pathname === "/dashboard" ? "/dashboard" : pathname)}`
      );
      return;
    }

    if (!isAuthenticatedClient()) {
      const lastActivity = getLastActivityMs();
      if (lastActivity > 0 && isAuthIdleExpired(lastActivity)) {
        clearAuthentication();
        router.replace("/login?reason=idle");
      }
      return;
    }

    touchAuthActivity();

    function onActivity() {
      const now = Date.now();
      if (now - lastTouchRef.current < THROTTLE_MS) return;
      lastTouchRef.current = now;
      touchAuthActivity();
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      if (isAuthIdleExpired(getLastActivityMs())) {
        clearAuthentication();
        router.replace("/login?reason=idle");
        return;
      }
      touchAuthActivity();
    }, THROTTLE_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
