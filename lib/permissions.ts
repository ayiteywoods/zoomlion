import type { DashboardCardId } from "@/lib/dashboard-cards";
import { isCustomCardId, readCustomSystems } from "@/lib/custom-systems";

export type UserRole =
  | "operations-manager"
  | "field-supervisor"
  | "corporate-admin"
  | "platform-admin";

export const roleLabels: Record<UserRole, string> = {
  "operations-manager": "Operations Manager",
  "field-supervisor": "Field Supervisor",
  "corporate-admin": "Corporate Admin",
  "platform-admin": "Platform Admin",
};

export const roleDescriptions: Record<UserRole, string> = {
  "operations-manager": "Full access to operations and corporate systems",
  "field-supervisor": "iWaste and SIP in the field",
  "corporate-admin": "Corporate reporting and iWaste overview",
  "platform-admin": "All systems including company registration",
};

const roleCardAccess: Record<UserRole, DashboardCardId[]> = {
  "operations-manager": ["iwaste", "corporate", "sip", "add-company"],
  "field-supervisor": ["iwaste", "sip"],
  "corporate-admin": ["iwaste", "corporate"],
  "platform-admin": ["iwaste", "corporate", "sip", "add-company"],
};

export function getVisibleCardIds(role: UserRole): DashboardCardId[] {
  const base = roleCardAccess[role];
  if (!base.includes("add-company")) return base;

  const customIds = readCustomSystems().map(
    (system) => `custom-${system.id}` as DashboardCardId
  );
  const withoutAdd = base.filter((id) => id !== "add-company");

  return [...withoutAdd, ...customIds, "add-company"];
}

export function canAccessCard(role: UserRole, cardId: DashboardCardId): boolean {
  if (isCustomCardId(cardId)) {
    return roleCardAccess[role].includes("add-company");
  }
  return roleCardAccess[role].includes(cardId);
}
