import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="animate-slide-up-footer relative shrink-0 overflow-hidden border-t border-brand-800/60 bg-brand-950 px-4 py-3 [animation-delay:750ms] lg:px-6">
      <div
        className="animate-shimmer absolute inset-x-0 top-0 h-px"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, color-mix(in srgb, var(--brand-300) 60%, transparent), transparent)`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs sm:flex-row">
        <p className="animate-fade-in text-center text-on-brand-muted sm:text-left [animation-delay:850ms]">
          © 2026 Zoomlion Waste Management. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link
            href="/privacy"
            className="animate-fade-in font-medium text-on-brand-muted transition-colors hover:text-on-brand [animation-delay:900ms]"
          >
            Privacy Policy
          </Link>
          <span className="text-white/30" aria-hidden>
            |
          </span>
          <Link
            href="/terms"
            className="animate-fade-in font-medium text-on-brand-muted transition-colors hover:text-on-brand [animation-delay:925ms]"
          >
            Terms of Use
          </Link>
          <span className="text-white/30" aria-hidden>
            |
          </span>
          <a
            href="https://helpdesk.nerasolgh.com/tickets/create"
            target="_blank"
            rel="noopener noreferrer"
            className="animate-fade-in font-medium text-on-brand-muted transition-colors hover:text-on-brand [animation-delay:950ms]"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
