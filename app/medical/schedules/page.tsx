import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function MedicalSchedulesPage() {
  return (
    <AppShell system="medical">
      <SystemPageContent
        title="Schedules"
        description="Plan and review medical waste pickup and treatment schedules. Overdue items flagged in notifications appear here."
      />
    </AppShell>
  );
}
