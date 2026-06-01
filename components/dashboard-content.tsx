"use client";

import { useState } from "react";
import type { DashboardCardId } from "@/lib/dashboard-cards";
import { useDashboard } from "@/components/dashboard-provider";
import { HeroSection } from "@/components/hero-section";
import { ActionCards } from "@/components/action-cards";
import { SystemHealthStrip } from "@/components/system-health-strip";

export function DashboardContent() {
  const [hoveredCardId, setHoveredCardId] = useState<DashboardCardId | null>(
    null
  );
  const { userName, lastLogin } = useDashboard();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HeroSection
        activeCardId={hoveredCardId}
        userName={userName}
        lastLogin={lastLogin}
        onDescriptionHoverEnd={() => setHoveredCardId(null)}
      />
      <SystemHealthStrip />
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col px-4 py-3 lg:px-8 lg:py-4">
        <ActionCards
          hoveredCardId={hoveredCardId}
          onCardHover={setHoveredCardId}
        />
      </div>
    </div>
  );
}
