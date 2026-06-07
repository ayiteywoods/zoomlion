import type {
  BuiltInDashboardCardId,
  DashboardCardId,
} from "@/lib/dashboard-cards";
import type { UserRole } from "@/lib/permissions";

export type SystemStatus = "available" | "maintenance" | "new";
export type HealthState = "operational" | "degraded" | "maintenance";

export type Organization = {
  id: string;
  name: string;
  region: string;
};

export const organizations: Organization[] = [
  { id: "gh-accra", name: "Zoomlion Ghana", region: "Greater Accra" },
  { id: "gh-kumasi", name: "Zoomlion Kumasi", region: "Ashanti Region" },
  { id: "gh-takoradi", name: "Zoomlion Western", region: "Western Region" },
];

export const defaultUser = {
  name: "John Doe",
  role: "operations-manager" as UserRole,
  organizationId: "gh-accra",
  lastLogin: "Not available",
  sessionExpiresIn: "Unknown",
};

export type SystemHealthItem = {
  id: DashboardCardId | "platform";
  label: string;
  state: HealthState;
  message: string;
};

export const systemHealthItems: SystemHealthItem[] = [
  {
    id: "iwaste",
    label: "iWaste",
    state: "operational",
    message: "Operational",
  },
  {
    id: "corporate",
    label: "PSL Corporate",
    state: "operational",
    message: "Operational",
  },
  {
    id: "sip",
    label: "SIP",
    state: "operational",
    message: "Operational",
  },
  {
    id: "beneficiary",
    label: "Beneficiary",
    state: "maintenance",
    message: "Under maintenance",
  },
  {
    id: "platform",
    label: "Platform",
    state: "operational",
    message: "All core services online",
  },
];

export type SearchItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: "System" | "Site" | "Action";
  /** Open in a new browser tab (used for external system launch). */
  openInNewTab?: boolean;
};

export const globalSearchItems: SearchItem[] = [
  {
    id: "iwaste",
    label: "iWaste System",
    description: "Operations, routes, and collections",
    href: "/systems/launch/iwaste",
    category: "System",
    openInNewTab: true,
  },
  {
    id: "corporate",
    label: "PSL Corporate",
    description: "Policies, reporting, and compliance",
    href: "/systems/launch/corporate",
    category: "System",
    openInNewTab: true,
  },
  {
    id: "sip",
    label: "SIP",
    description: "Integrated waste management and scheduling",
    href: "/systems/launch/sip",
    category: "System",
    openInNewTab: true,
  },
  // {
  //   id: "add-company",
  //   label: "Add New Company",
  //   description: "Register a company on the platform",
  //   href: "/companies/new",
  //   category: "Action",
  // },
  {
    id: "site-a",
    label: "Site A — Industrial zone",
    description: "Active collection site",
    href: "/iwaste/sites",
    category: "Site",
  },
  {
    id: "korle-bu",
    label: "Korle Bu Medical Centre",
    description: "Medical waste client",
    href: "/medical/clients",
    category: "Site",
  },
];

export const cardSystemMeta: Record<
  BuiltInDashboardCardId,
  {
    href: string;
    external?: boolean;
    status: SystemStatus;
    isPrimary?: boolean;
    actionLabel: string;
    disabled?: boolean;
  }
> = {
  iwaste: {
    href: "/systems/launch/iwaste",
    external: true,
    status: "available",
    isPrimary: true,
    actionLabel: "Go to iWaste",
  },
  corporate: {
    href: "/systems/launch/corporate",
    external: true,
    status: "available",
    actionLabel: "Go to PSL Corporate",
  },
  sip: {
    href: "/systems/launch/sip",
    external: true,
    status: "available",
    actionLabel: "Go to SIP",
  },
  beneficiary: {
    href: "",
    status: "maintenance",
    disabled: true,
    actionLabel: "Under maintenance",
  },
  "add-company": {
    href: "/companies/new",
    status: "new",
    actionLabel: "Add a company",
  },
};

export const keyboardShortcuts = [
  { keys: ["⌘", "K"], description: "Open global search" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close panels and dialogs" },
  { keys: ["G", "H"], description: "Go to dashboard home" },
];
