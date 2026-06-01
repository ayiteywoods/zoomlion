import type {
  BuiltInDashboardCardId,
  DashboardCardId,
} from "@/lib/dashboard-cards";
import {
  getCustomSystemById,
  getCustomSystemIdFromCardId,
  isCustomCardId,
} from "@/lib/custom-systems";
import { cardSystemMeta, type SystemStatus } from "@/lib/dashboard-data";

export function getCardSystemMeta(cardId: DashboardCardId): {
  href: string;
  external?: boolean;
  status: SystemStatus;
  isPrimary?: boolean;
  actionLabel: string;
} {
  if (isCustomCardId(cardId)) {
    const systemId = getCustomSystemIdFromCardId(cardId);
    const system = getCustomSystemById(systemId);
    const name = system?.name ?? "System";

    const href = system?.url || `/companies/custom/${systemId}`;

    return {
      href,
      external: Boolean(system?.url),
      status: "available",
      actionLabel: `Open ${name}`,
    };
  }

  return cardSystemMeta[cardId as BuiltInDashboardCardId];
}
