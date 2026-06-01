export type SystemKey = "iwaste" | "corporate" | "medical" | "companies";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export type SystemConfig = {
  key: SystemKey;
  title: string;
  subtitle: string;
  baseHref: string;
  nav: NavItem[];
};

export const systemConfigs: Record<SystemKey, SystemConfig> = {
  iwaste: {
    key: "iwaste",
    title: "iWaste System",
    subtitle: "Operations & collections",
    baseHref: "/iwaste",
    nav: [
      { label: "Overview", href: "/iwaste", description: "Today's operations snapshot" },
      {
        label: "Collections",
        href: "/iwaste/collections",
        description: "Scheduled and completed pickups",
      },
      {
        label: "Routes",
        href: "/iwaste/routes",
        description: "Fleet routes and assignments",
      },
      {
        label: "Sites",
        href: "/iwaste/sites",
        description: "Client sites and bins",
      },
    ],
  },
  corporate: {
    key: "corporate",
    title: "Corporate",
    subtitle: "Reporting & compliance",
    baseHref: "/corporate",
    nav: [
      { label: "Overview", href: "/corporate", description: "Executive summary" },
      {
        label: "Reports",
        href: "/corporate/reports",
        description: "Export and audit reports",
      },
      {
        label: "Compliance",
        href: "/corporate/compliance",
        description: "Policies and certifications",
      },
    ],
  },
  medical: {
    key: "medical",
    title: "Medical Waste",
    subtitle: "Hazardous waste management",
    baseHref: "/medical",
    nav: [
      { label: "Overview", href: "/medical", description: "Disposal status" },
      {
        label: "Schedules",
        href: "/medical/schedules",
        description: "Pickup and treatment schedules",
      },
      {
        label: "Clients",
        href: "/medical/clients",
        description: "Healthcare facilities",
      },
    ],
  },
  companies: {
    key: "companies",
    title: "Company registration",
    subtitle: "Onboard new clients",
    baseHref: "/companies/new",
    nav: [
      { label: "Register", href: "/companies/new", description: "New company form" },
      {
        label: "Guidelines",
        href: "/companies/guidelines",
        description: "Setup requirements",
      },
    ],
  },
};

export function getSystemConfigFromPath(pathname: string): SystemConfig | null {
  if (pathname.startsWith("/iwaste")) return systemConfigs.iwaste;
  if (pathname.startsWith("/corporate")) return systemConfigs.corporate;
  if (pathname.startsWith("/medical")) return systemConfigs.medical;
  if (pathname.startsWith("/companies")) return systemConfigs.companies;
  return null;
}
