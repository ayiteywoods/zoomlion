"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionCard } from "@/components/action-card";
import { AnimatedBackground } from "@/components/animated-background";
import { InlineAlert } from "@/components/inline-alert";
import {
  RecycleBinIcon,
  BuildingIcon,
  BiohazardBinIcon,
  PlusIcon,
  cardIconClass,
} from "@/components/icons";
import { useDashboard } from "@/components/dashboard-provider";
import { CUSTOM_SYSTEMS_UPDATED_EVENT } from "@/lib/custom-systems";
import { getCardSystemMeta } from "@/lib/dashboard-card-meta";
import {
  findDashboardCard,
  getAllDashboardCards,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
import { launchExternalSystem } from "@/lib/launch-system-client";
import { isExternalSystemId } from "@/lib/system-launch";

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
  const [cardsVersion, setCardsVersion] = useState(0);
  const [launchError, setLaunchError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [launchingId, setLaunchingId] = useState<DashboardCardId | null>(null);

  useEffect(() => {
    function refresh() {
      setCardsVersion((value) => value + 1);
    }

    window.addEventListener(CUSTOM_SYSTEMS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CUSTOM_SYSTEMS_UPDATED_EVENT, refresh);
  }, []);

  const allCards = useMemo(() => getAllDashboardCards(), [cardsVersion]);
  const visibleCards = allCards.filter((card) => visibleCardIds.includes(card.id));

  function handleLaunch(cardId: DashboardCardId) {
    if (!isExternalSystemId(cardId) || launchingId) return;

    setLaunchError(null);
    setLaunchingId(cardId);

    const result = launchExternalSystem(cardId);

    window.setTimeout(() => setLaunchingId(null), 1200);

    if (!result.ok) {
      const label = findDashboardCard(cardId)?.title ?? "System";
      setLaunchError({
        title: `Could not open ${label}`,
        message: result.message,
      });
    }
  }

  return (
    <section className="animate-fade-in relative flex min-h-0 flex-1 flex-col justify-center overflow-visible [animation-delay:350ms]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <AnimatedBackground />
      </div>
      {launchError && (
        <InlineAlert
          variant="error"
          title={launchError.title}
          onDismiss={() => setLaunchError(null)}
          className="relative z-10 mb-3 w-full animate-fade-in"
        >
          {launchError.message}
        </InlineAlert>
      )}
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
            const meta = getCardSystemMeta(card.id);
            return (
              <ActionCard
                key={card.id}
                title={card.title}
                description={card.cardDescription}
                href={meta.href}
                external={meta.external}
                status={meta.status}
                isPrimary={meta.isPrimary}
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
                onLaunch={
                  isExternalSystemId(card.id)
                    ? () => handleLaunch(card.id)
                    : undefined
                }
                launchDisabled={launchingId !== null}
                actionLabel={
                  launchingId === card.id ? "Opening…" : meta.actionLabel
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
