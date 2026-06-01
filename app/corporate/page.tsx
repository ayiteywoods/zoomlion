import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function CorporateOverviewPage() {
  return (
    <AppShell system="corporate">
      <SystemPageContent
        title="Executive summary"
        description="High-level view of corporate waste programs, compliance posture, and regional performance."
      />
    </AppShell>
  );
}
