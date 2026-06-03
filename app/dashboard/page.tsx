import { SiteHeader } from "@/components/site-header";
import { DashboardContent } from "@/components/dashboard-content";
import { SiteFooter } from "@/components/site-footer";

export default function DashboardPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface"
      >
        <DashboardContent />
      </main>
      <SiteFooter />
    </div>
  );
}
