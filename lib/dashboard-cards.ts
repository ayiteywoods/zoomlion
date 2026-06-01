export type DashboardCardId = "iwaste" | "corporate" | "sip" | "add-company";

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
    title: "PSL Corporate",
    cardDescription:
      "Company-wide policies, reporting, and compliance documents.",
    heroDescription:
      "Open Corporate resources for company-wide policies, reporting, compliance documents, and administrative waste management tools.",
    variant: "violet",
    logoSrc: "/zl.png",
    logoAlt: "Zoomlion logo",
  },
  {
    id: "sip",
    title: "SIP",
    cardDescription:
      "Integrated waste management, scheduling, and compliance workflows.",
    heroDescription:
      "Open SIP to manage integrated waste operations, scheduling, client records, and compliance workflows across your service areas.",
    variant: "amber",
    logoSrc: "/zl.png",
    logoAlt: "Zoomlion logo",
  },
  {
    id: "add-company",
    title: "Add New Company",
    cardDescription:
      "Register a company with profiles, users, and service setup.",
    heroDescription:
      "Register a new company on the platform to set up waste management profiles, users, and service configurations.",
    variant: "rose",
  },
];

export function getHeroDescription(cardId: DashboardCardId | null): string {
  if (!cardId) return DEFAULT_HERO_DESCRIPTION;
  return (
    dashboardCards.find((card) => card.id === cardId)?.heroDescription ??
    DEFAULT_HERO_DESCRIPTION
  );
}
