"use client";

import { useEffect, useState } from "react";
import { HeroIllustration } from "@/components/hero-illustration";
import { FlyingDashedLines } from "@/components/flying-dashed-lines";
import { IndustrialRecyclingIcons } from "@/components/industrial-recycling-icons";
import {
  DEFAULT_HERO_DESCRIPTION,
  findDashboardCard,
  getHeroDescription,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
import { isCustomCardId } from "@/lib/custom-systems";

const accentByCard = {
  iwaste: "bg-emerald-500",
  corporate: "bg-violet-500",
  sip: "bg-amber-500",
  beneficiary: "bg-rose-500",
  // "add-company": "bg-rose-500",
} as const;

type HeroSectionProps = {
  activeCardId: DashboardCardId | null;
  userName: string;
  lastLogin: string;
  onDescriptionHoverEnd?: () => void;
};

export function HeroSection({
  activeCardId,
  userName,
  lastLogin,
  onDescriptionHoverEnd,
}: HeroSectionProps) {
  const targetDescription = getHeroDescription(activeCardId);
  const [displayedDescription, setDisplayedDescription] = useState(
    DEFAULT_HERO_DESCRIPTION
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (targetDescription === displayedDescription) return;

    setVisible(false);
    const timeout = setTimeout(() => {
      setDisplayedDescription(targetDescription);
      setVisible(true);
    }, 160);

    return () => clearTimeout(timeout);
  }, [targetDescription, displayedDescription]);

  const accentClass =
    activeCardId && activeCardId in accentByCard
      ? accentByCard[activeCardId as keyof typeof accentByCard]
      : isCustomCardId(activeCardId ?? "")
        ? "bg-sky-500"
        : "bg-primary";

  const activeCard = activeCardId ? findDashboardCard(activeCardId) : undefined;

  return (
    <section className="relative shrink-0 overflow-hidden border-b border-line bg-surface-elevated">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18]"
        aria-hidden
      >
        <FlyingDashedLines />
        <IndustrialRecyclingIcons />
        <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary-soft blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-blue-100/80 blur-2xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 py-3 sm:grid-cols-[1fr_auto] sm:gap-8 sm:px-6 sm:py-4 lg:px-10 lg:py-5">
        <div className="py-0 sm:py-2">
          <p className="hidden text-xs font-medium uppercase tracking-wider text-primary-muted sm:block">
            Dashboard
          </p>
          <h1 className="mt-0 text-lg font-semibold leading-tight tracking-tight text-primary sm:mt-1 sm:text-2xl lg:text-[1.75rem]">
            <span
              className="animate-blur-in inline-block"
              style={{ animationDelay: "120ms" }}
            >
              Welcome back,
            </span>{" "}
            <span
              className="animate-blur-in inline-block text-primary-muted"
              style={{ animationDelay: "220ms" }}
            >
              {userName}
            </span>
          </h1>
          <p className="mt-1 hidden text-xs text-muted sm:block">
            Last login · {lastLogin}
          </p>

          <div
            className={`relative mt-3 hidden h-0.5 w-14 origin-left rounded-full transition-colors duration-300 sm:block ${accentClass}`}
          />

          <div
            className="mt-4 hidden min-h-[3.5rem] max-w-xl sm:block"
            onMouseLeave={onDescriptionHoverEnd}
          >
            {activeCard && (
              <p
                className={`mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-muted transition-all duration-300 ${
                  visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
              >
                {activeCard.title}
              </p>
            )}
            <p
              className={`text-sm leading-6 text-muted transition-all duration-300 ease-out ${
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {displayedDescription}
            </p>
          </div>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}
