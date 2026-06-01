"use client";

import { ActionCard } from "@/components/action-card";
import { AnimatedBackground } from "@/components/animated-background";
import {
  RecycleBinIcon,
  BuildingIcon,
  BiohazardBinIcon,
  PlusIcon,
  cardIconClass,
} from "@/components/icons";
import { useDashboard } from "@/components/dashboard-provider";
import { cardSystemMeta } from "@/lib/dashboard-data";
import { dashboardCards, type DashboardCardId } from "@/lib/dashboard-cards";

const hoverIcons = {
  iwaste: <RecycleBinIcon className={cardIconClass} />,
  corporate: <BuildingIcon className={cardIconClass} />,
  sip: <BiohazardBinIcon className={cardIconClass} />,
} as const;

type ActionCardsProps = {
  hoveredCardId: DashboardCardId | null;
  onCardHover: (id: DashboardCardId | null) => void;
};

export function ActionCards({ hoveredCardId, onCardHover }: ActionCardsProps) {
  const { visibleCardIds } = useDashboard();
  const visibleCards = dashboardCards.filter((card) =>
    visibleCardIds.includes(card.id)
  );

  return (
    <section className="animate-fade-in relative flex min-h-0 flex-1 flex-col justify-center overflow-visible [animation-delay:350ms]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <AnimatedBackground />
      </div>
      {visibleCards.length === 0 ? (
        <p className="relative text-center text-sm text-muted">
          No systems available for your role. Change role in Profile to explore
          access levels.
        </p>
      ) : (
        <div
          className={`relative grid h-full min-h-0 w-full items-stretch gap-2 p-1 sm:gap-3 lg:gap-4 lg:p-2 ${
            visibleCards.length === 1
              ? "mx-auto max-w-sm grid-cols-1"
              : visibleCards.length === 2
                ? "mx-auto max-w-2xl grid-cols-2"
                : visibleCards.length === 3
                  ? "grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {visibleCards.map((card, index) => {
            const meta = cardSystemMeta[card.id];
            return (
              <ActionCard
                key={card.id}
                title={card.title}
                description={card.cardDescription}
                href={meta.href}
                external={meta.external}
                status={meta.status}
                isPrimary={meta.isPrimary}
                actionLabel={meta.actionLabel}
                logoSrc={card.logoSrc}
                logoAlt={card.logoAlt}
                logoImageClassName={card.logoImageClassName}
                hoverIcon={
                  card.id in hoverIcons
                    ? hoverIcons[card.id as keyof typeof hoverIcons]
                    : undefined
                }
                icon={
                  card.id === "add-company" ? (
                    <PlusIcon className={cardIconClass} />
                  ) : undefined
                }
                variant={card.variant}
                animationDelay={450 + index * 100}
                isActive={hoveredCardId === card.id}
                onHoverStart={() => onCardHover(card.id)}
                onHoverEnd={() => onCardHover(null)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
