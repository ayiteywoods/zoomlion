import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function CorporateReportsPage() {
  return (
    <AppShell system="corporate">
      <SystemPageContent
        title="Reports"
        description="Generate and download compliance, audit, and operational reports. Q1 exports and scheduled reports will be managed here."
      />
    </AppShell>
  );
}
