import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function IwasteCollectionsPage() {
  return (
    <AppShell system="iwaste">
      <SystemPageContent
        title="Collections"
        description="View scheduled, in-progress, and completed waste collections. Filter by site, route, or date range once connected to live data."
      />
    </AppShell>
  );
}
