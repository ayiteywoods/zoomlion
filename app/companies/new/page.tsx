import { AppShell } from "@/components/app-shell";
import { AddCompanyForm } from "@/components/add-company-form";
import { SystemPageContent } from "@/components/system-page-content";

export default function NewCompanyPage() {
  return (
    <AppShell system="companies">
      <SystemPageContent
        title="Add a system"
        description="Register a new system on the hub with a name, description, URL, and logo. It will appear on your dashboard alongside iWaste, PSL Corporate, and SIP."
      >
        <AddCompanyForm />
      </SystemPageContent>
    </AppShell>
  );
}
