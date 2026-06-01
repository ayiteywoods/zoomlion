import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function IwasteOverviewPage() {
  return (
    <AppShell system="iwaste">
      <SystemPageContent
        title="Operations snapshot"
        description="Monitor today's collections, route progress, and site activity across your assigned region. Data shown here will sync from your iWaste backend."
      />
    </AppShell>
  );
}
