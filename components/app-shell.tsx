"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bars3Icon,
  ChevronRightIcon,
  HomeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { GlobalSearch, navSearchInputClass } from "@/components/global-search";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import {
  systemConfigs,
  type SystemKey,
  type SystemConfig,
} from "@/lib/system-navigation";

type AppShellProps = {
  system: SystemKey;
  children: ReactNode;
};

export function AppShell({ system, children }: AppShellProps) {
  const pathname = usePathname();
  const config = systemConfigs[system];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = buildBreadcrumbs(pathname, config);
  const activeNav = config.nav.find((item) => item.href === pathname);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <header className="relative z-30 shrink-0 border-b border-brand-800/60 bg-brand-950 px-4 py-3 lg:px-6">
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 ring-1 ring-white/10">
              <Image
                src="/zl.png"
                alt=""
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="hidden text-sm font-semibold text-white sm:inline">
              {config.title}
            </span>
          </Link>
          <div className="absolute left-1/2 z-50 hidden w-full max-w-sm -translate-x-1/2 md:block lg:max-w-md">
            <GlobalSearch className="w-full" inputClassName={navSearchInputClass} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeModeToggle />
            <ProfileDropdown />
          </div>
        </div>
        <nav
          aria-label="Breadcrumb"
          className="mt-2 flex flex-wrap items-center gap-1 text-xs text-on-brand-muted"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRightIcon className="h-3 w-3 opacity-60" aria-hidden />
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-white">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-white">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-brand-950/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface-elevated shadow-xl transition-transform lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:translate-x-0 lg:shadow-none xl:w-60 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
            <p className="text-sm font-semibold text-primary">{config.title}</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-muted hover:bg-primary-soft"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="hidden border-b border-line px-4 py-4 lg:block">
            <p className="text-sm font-semibold text-primary">{config.title}</p>
            <p className="text-xs text-muted">{config.subtitle}</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2" aria-label={`${config.title} navigation`}>
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            >
              <HomeIcon className="h-4 w-4" />
              Dashboard home
            </Link>
            {config.nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`mb-0.5 block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary-soft font-semibold text-primary ring-1 ring-line"
                      : "font-medium text-muted hover:bg-primary-soft/60 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
            {activeNav && (
              <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">
                  {activeNav.label}
                </h1>
                {activeNav.description && (
                  <p className="mt-1 text-sm text-muted">
                    {activeNav.description}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function buildBreadcrumbs(pathname: string, config: SystemConfig) {
  const crumbs = [{ label: "Home", href: "/dashboard" }];
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const navItem = config.nav.find((n) => n.href === path);
    crumbs.push({
      label: navItem?.label ?? segment.replace(/-/g, " "),
      href: path,
    });
  }
  return crumbs;
}
