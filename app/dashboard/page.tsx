import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DashboardContent } from "@/components/dashboard-content";
import { SiteFooter } from "@/components/site-footer";
import {
  AUTH_COOKIE,
  AUTH_LAST_ACTIVITY_COOKIE,
  HUB_SESSION_COOKIE,
  isHubSessionActive,
} from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isAuthenticated = isHubSessionActive(
    cookieStore.get(AUTH_COOKIE)?.value,
    cookieStore.get(AUTH_LAST_ACTIVITY_COOKIE)?.value,
    cookieStore.get(HUB_SESSION_COOKIE)?.value
  );

  if (!isAuthenticated) {
    redirect("/login?from=/dashboard");
  }

  return (
    <div className="dashboard-shell flex h-dvh flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="dashboard-main-scroll relative flex h-0 min-h-0 flex-1 flex-col bg-surface lg:overflow-hidden"
      >
        <DashboardContent />
      </main>
      <SiteFooter />
    </div>
  );
}
