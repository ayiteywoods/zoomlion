import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function IwasteSitesPage() {
  return (
    <AppShell system="iwaste">
      <SystemPageContent
        title="Sites"
        description="Browse client sites, bin inventory, and service levels. Site A — Industrial zone and other locations will list here."
      />
    </AppShell>
  );
}
