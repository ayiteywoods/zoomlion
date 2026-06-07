"use client";

import Image from "next/image";
import Link from "next/link";
// import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { GlobalSearch, navSearchInputClass } from "@/components/global-search";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";

export function SiteHeader() {
  return (
    <header className="animate-fade-in-down relative z-30 shrink-0 bg-brand-950 px-4 py-3 lg:px-6">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent to-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, var(--brand-shimmer), transparent)`,
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center gap-2 lg:gap-3">
        <Link
          href="/dashboard"
          className="animate-fade-in-up flex shrink-0 items-center gap-3"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 ring-1 ring-white/10">
            <Image
              src="/zl.png"
              alt="ZoomLion Ghana Ltd"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-semibold leading-tight text-white">
              ZoomLion Ghana Ltd
            </p>
          </div>
        </Link>

        <div
          className="animate-fade-in-up absolute left-1/2 z-50 hidden w-full max-w-md -translate-x-1/2 md:block lg:max-w-xl"
          style={{ animationDelay: "160ms" }}
        >
          <GlobalSearch className="w-full" inputClassName={navSearchInputClass} />
        </div>

        <div
          className="animate-fade-in-up relative z-10 ml-auto flex shrink-0 items-center gap-2"
          style={{ animationDelay: "220ms" }}
        >
          {/* <button
            type="button"
            className="hidden h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/20 sm:flex"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span className="hidden lg:inline">AI Assistant</span>
          </button> */}

          <ThemeModeToggle />

          <ProfileDropdown />
        </div>
      </div>

      <div
        className="animate-fade-in-up relative z-50 mt-3 md:hidden"
        style={{ animationDelay: "280ms" }}
      >
        <GlobalSearch className="w-full" inputClassName={navSearchInputClass} />
      </div>
    </header>
  );
}
