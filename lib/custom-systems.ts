import type { DashboardCard } from "@/lib/dashboard-cards";

export type CustomSystem = {
  id: string;
  name: string;
  description: string;
  url: string;
  logoDataUrl: string;
  createdAt: string;
};

export const CUSTOM_SYSTEMS_STORAGE_KEY = "zl-custom-systems";
export const CUSTOM_SYSTEMS_UPDATED_EVENT = "zl-custom-systems-updated";

const CUSTOM_CARD_VARIANTS = ["emerald", "violet", "amber"] as const;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export type CustomSystemInput = {
  name: string;
  description: string;
  url: string;
  logoDataUrl: string;
};

export function normalizeSystemUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("System URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid system URL (e.g. https://app.example.com).");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must use http or https.");
  }

  return parsed.toString();
}

export function isCustomCardId(id: string): id is `custom-${string}` {
  return id.startsWith("custom-");
}

export function getCustomSystemIdFromCardId(
  cardId: `custom-${string}`
): string {
  return cardId.slice("custom-".length);
}

export function createCustomSystemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sys-${Date.now().toString(36)}`;
}

export function readCustomSystems(): CustomSystem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CUSTOM_SYSTEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isCustomSystemRecord)
      .map((record) => normalizeStoredSystem(record));
  } catch {
    return [];
  }
}

function isCustomSystemRecord(value: unknown): value is CustomSystem {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    (typeof record.url === "string" || record.url === undefined) &&
    typeof record.logoDataUrl === "string" &&
    typeof record.createdAt === "string"
  );
}

function normalizeStoredSystem(record: CustomSystem & { url?: string }): CustomSystem {
  return {
    ...record,
    url: typeof record.url === "string" ? record.url : "",
  };
}

export function saveCustomSystem(input: CustomSystemInput): CustomSystem {
  const systems = readCustomSystems();
  const system: CustomSystem = {
    id: createCustomSystemId(),
    name: input.name.trim(),
    description: input.description.trim(),
    url: normalizeSystemUrl(input.url),
    logoDataUrl: input.logoDataUrl,
    createdAt: new Date().toISOString(),
  };

  systems.push(system);
  localStorage.setItem(CUSTOM_SYSTEMS_STORAGE_KEY, JSON.stringify(systems));
  window.dispatchEvent(new Event(CUSTOM_SYSTEMS_UPDATED_EVENT));
  return system;
}

export function getCustomSystemById(id: string): CustomSystem | undefined {
  return readCustomSystems().find((system) => system.id === id);
}

export function customSystemToDashboardCard(
  system: CustomSystem,
  index: number
): DashboardCard {
  return {
    id: `custom-${system.id}`,
    title: system.name,
    cardDescription: system.description,
    heroDescription: system.description,
    variant: CUSTOM_CARD_VARIANTS[index % CUSTOM_CARD_VARIANTS.length],
    logoSrc: system.logoDataUrl || undefined,
    logoAlt: `${system.name} logo`,
  };
}

export function getCustomDashboardCards(): DashboardCard[] {
  return readCustomSystems().map(customSystemToDashboardCard);
}

export async function readLogoFileAsDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_LOGO_TYPES.has(file.type)) {
    throw new Error("Logo must be a PNG, JPEG, WebP, or SVG image.");
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo must be 2 MB or smaller.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read the logo file."));
    };
    reader.onerror = () => reject(new Error("Unable to read the logo file."));
    reader.readAsDataURL(file);
  });
}
