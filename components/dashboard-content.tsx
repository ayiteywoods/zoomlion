"use client";

import { useEffect, useState } from "react";
import type { DashboardCardId } from "@/lib/dashboard-cards";
import { useDashboard } from "@/components/dashboard-provider";
import { HeroSection } from "@/components/hero-section";
import { ActionCards } from "@/components/action-cards";
import { SystemHealthStrip } from "@/components/system-health-strip";
import { InlineAlert } from "@/components/inline-alert";

export function DashboardContent() {
  const [showAddedBanner, setShowAddedBanner] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("zl-system-added") === "1") {
      sessionStorage.removeItem("zl-system-added");
      setShowAddedBanner(true);
    }
  }, []);
  const [hoveredCardId, setHoveredCardId] = useState<DashboardCardId | null>(
    null
  );
  const { userName, lastLogin } = useDashboard();

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      {showAddedBanner && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3 lg:px-8">
          <InlineAlert
            variant="info"
            title="System added"
            onDismiss={() => setShowAddedBanner(false)}
          >
            Your new system is now on the dashboard.
          </InlineAlert>
        </div>
      )}
      <HeroSection
        activeCardId={hoveredCardId}
        userName={userName}
        lastLogin={lastLogin}
        onDescriptionHoverEnd={() => setHoveredCardId(null)}
      />
      <SystemHealthStrip />
      <div className="mx-auto w-full max-w-7xl flex-none px-4 py-3 pb-24 sm:pb-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-8 lg:py-4 lg:pb-4">
        <ActionCards
          hoveredCardId={hoveredCardId}
          onCardHover={setHoveredCardId}
        />
      </div>
    </div>
  );
}
