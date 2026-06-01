export type ThemeMode = "light" | "dark" | "system";

export type BrandThemeId = "blue" | "indigo" | "slate" | "teal";

export type BrandTheme = {
  id: BrandThemeId;
  label: string;
  description: string;
  swatch: string;
};

export const brandThemes: BrandTheme[] = [
  {
    id: "blue",
    label: "Zoomlion Blue",
    description: "Default brand",
    swatch: "#172554",
  },
  {
    id: "indigo",
    label: "Indigo",
    description: "Deep indigo",
    swatch: "#1e1b4b",
  },
  {
    id: "slate",
    label: "Slate",
    description: "Neutral corporate",
    swatch: "#0f172a",
  },
  {
    id: "teal",
    label: "Teal",
    description: "Sustainability accent",
    swatch: "#134e4a",
  },
];

export const themeModeOptions: { id: ThemeMode; label: string; description: string }[] =
  [
    { id: "light", label: "Light", description: "Light backgrounds" },
    { id: "dark", label: "Dark", description: "Dark backgrounds" },
    { id: "system", label: "System", description: "Match device setting" },
  ];

export const defaultBrandTheme: BrandThemeId = "blue";
export const defaultThemeMode: ThemeMode = "light";
