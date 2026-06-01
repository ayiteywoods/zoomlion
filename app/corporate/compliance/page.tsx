import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function CorporateCompliancePage() {
  return (
    <AppShell system="corporate">
      <SystemPageContent
        title="Compliance"
        description="Access policies, certifications, and regulatory documentation for corporate waste programs."
      />
    </AppShell>
  );
}
