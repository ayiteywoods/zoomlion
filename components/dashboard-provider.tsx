"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultUser, organizations } from "@/lib/dashboard-data";
import {
  getVisibleCardIds,
  roleLabels,
  type UserRole,
} from "@/lib/permissions";
import type { DashboardCardId } from "@/lib/dashboard-cards";
import { CUSTOM_SYSTEMS_UPDATED_EVENT } from "@/lib/custom-systems";
import {
  defaultBrandTheme,
  defaultThemeMode,
  type BrandThemeId,
  type ThemeMode,
} from "@/lib/theme-settings";
import {
  AUTH_UPDATED_EVENT,
  getAuthCompanyName,
  getAuthUser,
  getAuthUserType,
  getDisplayName,
  getLastLoginLabel,
  getSessionExpiresInLabel,
  touchAuthActivity,
} from "@/lib/auth";
import type { AuthUser } from "@/lib/auth-api";

type DashboardContextValue = {
  userName: string;
  authUser: AuthUser | null;
  role: UserRole;
  roleLabel: string;
  userTypeLabel: string;
  organizationId: string;
  organizationName: string;
  organizationRegion: string;
  lastLogin: string;
  sessionExpiresIn: string;
  visibleCardIds: DashboardCardId[];
  themeMode: ThemeMode;
  brandTheme: BrandThemeId;
  resolvedDark: boolean;
  shortcutsOpen: boolean;
  settingsOpen: boolean;
  setRole: (role: UserRole) => void;
  setOrganizationId: (id: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBrandTheme: (brand: BrandThemeId) => void;
  setShortcutsOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const ROLE_STORAGE_KEY = "zl-demo-role";
const ORG_STORAGE_KEY = "zl-demo-org";
const THEME_MODE_STORAGE_KEY = "zl-theme-mode";
const BRAND_STORAGE_KEY = "zl-brand";

function readSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveThemeDark(mode: ThemeMode, systemDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && systemDark);
}

function applyThemeToDocument(mode: ThemeMode, brand: BrandThemeId, systemDark: boolean) {
  if (typeof document === "undefined") return;
  const dark = resolveThemeDark(mode, systemDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.brand = brand;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(defaultUser.role);
  const [organizationId, setOrganizationIdState] = useState(
    defaultUser.organizationId
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultThemeMode);
  const [brandTheme, setBrandThemeState] =
    useState<BrandThemeId>(defaultBrandTheme);
  const [systemDark, setSystemDark] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [customSystemsVersion, setCustomSystemsVersion] = useState(0);
  const [userName, setUserName] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [lastLogin, setLastLogin] = useState(defaultUser.lastLogin);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(
    defaultUser.sessionExpiresIn
  );

  const resolvedDark = resolveThemeDark(themeMode, systemDark);

  const syncAuthProfile = useCallback(() => {
    const user = getAuthUser();
    setAuthUser(user);
    setUserName(getDisplayName(user) ?? "");
    setLastLogin(getLastLoginLabel());
    setSessionExpiresIn(getSessionExpiresInLabel());
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    const storedOrg = localStorage.getItem(ORG_STORAGE_KEY);
    const storedMode = localStorage.getItem(
      THEME_MODE_STORAGE_KEY
    ) as ThemeMode | null;
    const storedBrand = localStorage.getItem(
      BRAND_STORAGE_KEY
    ) as BrandThemeId | null;

    if (storedRole) setRoleState(storedRole);
    if (storedOrg) setOrganizationIdState(storedOrg);
    if (storedMode) setThemeModeState(storedMode);
    if (storedBrand) setBrandThemeState(storedBrand);

    syncAuthProfile();

    setSystemDark(readSystemDark());
    setHydrated(true);
  }, [syncAuthProfile]);

  useEffect(() => {
    syncAuthProfile();

    function onAuthUpdated() {
      syncAuthProfile();
    }

    window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
  }, [syncAuthProfile]);

  useEffect(() => {
    if (!hydrated) return;

    const refreshSessionMeta = () => {
      setLastLogin(getLastLoginLabel());
      setSessionExpiresIn(getSessionExpiresInLabel());
    };

    const interval = window.setInterval(refreshSessionMeta, 60_000);
    return () => window.clearInterval(interval);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    let lastBump = 0;

    function onActivity() {
      const now = Date.now();
      if (now - lastBump < 30_000) return;
      lastBump = now;
      touchAuthActivity();
      setSessionExpiresIn(getSessionExpiresInLabel());
    }

    const events = ["click", "keydown", "pointerdown"] as const;
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyThemeToDocument(themeMode, brandTheme, systemDark);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    localStorage.setItem(BRAND_STORAGE_KEY, brandTheme);
  }, [hydrated, themeMode, brandTheme, systemDark]);

  useEffect(() => {
    function onCustomSystemsUpdated() {
      setCustomSystemsVersion((value) => value + 1);
    }

    window.addEventListener(CUSTOM_SYSTEMS_UPDATED_EVENT, onCustomSystemsUpdated);
    return () =>
      window.removeEventListener(
        CUSTOM_SYSTEMS_UPDATED_EVENT,
        onCustomSystemsUpdated
      );
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      if (e.key === "Escape") {
        setShortcutsOpen(false);
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen]);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    localStorage.setItem(ROLE_STORAGE_KEY, next);
  }, []);

  const setOrganizationId = useCallback((id: string) => {
    setOrganizationIdState(id);
    localStorage.setItem(ORG_STORAGE_KEY, id);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const nextSystemDark = mode === "system" ? readSystemDark() : systemDark;
    if (mode === "system") setSystemDark(nextSystemDark);
    setThemeModeState(mode);
    applyThemeToDocument(mode, brandTheme, nextSystemDark);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    }
  }, [brandTheme, systemDark]);

  const setBrandTheme = useCallback((brand: BrandThemeId) => {
    setBrandThemeState(brand);
    applyThemeToDocument(themeMode, brand, systemDark);
    if (typeof window !== "undefined") {
      localStorage.setItem(BRAND_STORAGE_KEY, brand);
    }
  }, [themeMode, systemDark]);

  const organization = useMemo(
    () =>
      organizations.find((o) => o.id === organizationId) ?? organizations[0],
    [organizationId]
  );

  const organizationName =
    getAuthCompanyName(authUser) ?? organization.name;

  const userTypeLabel = getAuthUserType(authUser) ?? "";

  const value = useMemo<DashboardContextValue>(
    () => ({
      userName,
      authUser,
      role,
      roleLabel: roleLabels[role],
      userTypeLabel,
      organizationId,
      organizationName,
      organizationRegion: organization.region,
      lastLogin,
      sessionExpiresIn,
      visibleCardIds: getVisibleCardIds(role),
      themeMode,
      brandTheme,
      resolvedDark,
      shortcutsOpen,
      settingsOpen,
      setRole,
      setOrganizationId,
      setThemeMode,
      setBrandTheme,
      setShortcutsOpen,
      setSettingsOpen,
    }),
    [
      customSystemsVersion,
      role,
      organizationId,
      organization,
      authUser,
      organizationName,
      userTypeLabel,
      userName,
      lastLogin,
      sessionExpiresIn,
      themeMode,
      brandTheme,
      resolvedDark,
      shortcutsOpen,
      settingsOpen,
      setRole,
      setOrganizationId,
      setThemeMode,
      setBrandTheme,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
