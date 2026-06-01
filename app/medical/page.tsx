import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function MedicalOverviewPage() {
  return (
    <AppShell system="medical">
      <SystemPageContent
        title="Disposal status"
        description="Overview of medical and hazardous waste handling, including overdue pickups and treatment partner status."
      />
    </AppShell>
  );
}
