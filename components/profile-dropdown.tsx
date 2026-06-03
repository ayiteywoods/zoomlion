"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { useDashboard } from "@/components/dashboard-provider";
import { clearAuthentication } from "@/lib/auth";

const menuItems = [
  { label: "Profile", href: "/profile", icon: UserIcon },
  {
    label: "Support",
    href: "https://helpdesk.nerasolgh.com/tickets/create",
    icon: QuestionMarkCircleIcon,
    external: true,
  },
] as const;

export function ProfileDropdown() {
  const router = useRouter();
  const {
    userName,
    roleLabel,
    organizationName,
    sessionExpiresIn,
    setSettingsOpen,
    setShortcutsOpen,
  } = useDashboard();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-white ring-1 transition-all duration-300 hover:scale-105 active:scale-95 ${
          open
            ? "bg-white/20 ring-brand-300/60 shadow-[0_0_16px_rgba(96,165,250,0.35)]"
            : "bg-white/10 ring-white/10 hover:bg-white/15"
        }`}
      >
        <UserCircleIcon className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline">Profile</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-on-brand-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl bg-surface-elevated py-2 shadow-[0_12px_40px_rgba(23,37,84,0.18)] ring-1 ring-line"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-primary">{userName}</p>
            <p className="mt-0.5 text-sm text-muted">
              {roleLabel} · {organizationName}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              Session expires in {sessionExpiresIn}
            </p>
          </div>

          <div className="py-1">
            {menuItems.map(({ label, href, icon: Icon, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              )
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setSettingsOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
            >
              <Cog6ToothIcon className="h-5 w-5 shrink-0" />
              App settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShortcutsOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded border border-line text-[10px] font-bold">
                ?
              </span>
              Keyboard shortcuts
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                clearAuthentication();
                router.push("/login");
                router.refresh();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
