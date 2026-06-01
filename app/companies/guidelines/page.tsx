import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function CompanyGuidelinesPage() {
  return (
    <AppShell system="companies">
      <SystemPageContent
        title="Setup guidelines"
        description="Documentation for onboarding new companies — required fields, compliance checks, and approval workflow."
      />
    </AppShell>
  );
}
