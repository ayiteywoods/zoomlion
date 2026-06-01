import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function MedicalClientsPage() {
  return (
    <AppShell system="medical">
      <SystemPageContent
        title="Healthcare clients"
        description="Manage hospitals, clinics, and facilities under medical waste contracts including Korle Bu Medical Centre."
      />
    </AppShell>
  );
}
