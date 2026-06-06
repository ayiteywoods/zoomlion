import {
  getCustomDashboardCards,
  isCustomCardId,
} from "@/lib/custom-systems";

export type BuiltInDashboardCardId =
  | "iwaste"
  | "corporate"
  | "sip"
  | "add-company";

export type DashboardCardId = BuiltInDashboardCardId | `custom-${string}`;

export const DEFAULT_HERO_DESCRIPTION =
  "Select a system below to continue. Hover a card for a short summary.";

export type DashboardCard = {
  id: DashboardCardId;
  title: string;
  cardDescription: string;
  heroDescription: string;
  variant: "emerald" | "violet" | "amber" | "rose";
  logoSrc?: string;
  logoAlt?: string;
  /** Extra classes on the logo image (e.g. scale up wide/landscape marks) */
  logoImageClassName?: string;
};

export const dashboardCards: DashboardCard[] = [
  {
    id: "iwaste",
    title: "iWaste System",
    cardDescription:
      "Track collections, routes, and day-to-day waste operations.",
    heroDescription:
      "Access the iWaste System to track collections, monitor routes, and manage day-to-day waste operations across your sites in one place.",
    variant: "emerald",
    logoSrc: "/zl.png",
    logoAlt: "Zoomlion logo",
  },
  {
    id: "corporate",
    title: "Corporate Business System",
    cardDescription:
      "Company-wide policies, reporting, and compliance documents.",
    heroDescription:
      "Delivering end-to-end environmental solutions tailored to the needs of corporate organisations, institutions, and industries that demand reliability, compliance, and a cleaner operational footprint.",
    variant: "violet",
    logoSrc: "/zl.png",
    logoAlt: "Zoomlion logo",
  },
  {
    id: "sip",
    title: "SIP System",
    cardDescription:
      "Integrated waste management, scheduling, and compliance workflows.",
    heroDescription:
      "Transforming local environments into cleaner, healthier, and more sustainable communities by collaborating with local authorities.",
    variant: "amber",
    logoSrc: "/zl.png",
    logoAlt: "Zoomlion logo",
  },
  {
    id: "add-company",
    title: "Add New Company",
    cardDescription:
      "Add a system with name, description, URL, and logo to the hub.",
    heroDescription:
      "Add a new system to the hub with a name, description, URL, and logo. It will appear on your dashboard for quick access.",
    variant: "rose",
  },
];

export function getAllDashboardCards(): DashboardCard[] {
  const customCards = getCustomDashboardCards();
  const withoutAdd = dashboardCards.filter((card) => card.id !== "add-company");
  const addCard = dashboardCards.find((card) => card.id === "add-company");
  if (!addCard) return [...withoutAdd, ...customCards];
  return [...withoutAdd, ...customCards, addCard];
}

export function findDashboardCard(
  cardId: DashboardCardId
): DashboardCard | undefined {
  if (isCustomCardId(cardId)) {
    return getCustomDashboardCards().find((card) => card.id === cardId);
  }
  return dashboardCards.find((card) => card.id === cardId);
}

export function getHeroDescription(cardId: DashboardCardId | null): string {
  if (!cardId) return DEFAULT_HERO_DESCRIPTION;
  return findDashboardCard(cardId)?.heroDescription ?? DEFAULT_HERO_DESCRIPTION;
}
