import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function IwasteRoutesPage() {
  return (
    <AppShell system="iwaste">
      <SystemPageContent
        title="Routes"
        description="Manage fleet routes, driver assignments, and real-time progress. Route optimization tools will appear here."
      />
    </AppShell>
  );
}
