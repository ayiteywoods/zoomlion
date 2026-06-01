import { AppShell } from "@/components/app-shell";
import { SystemPageContent } from "@/components/system-page-content";

export default function NewCompanyPage() {
  return (
    <AppShell system="companies">
      <SystemPageContent
        title="Register company"
        description="Create a new company profile with waste service configuration, billing contacts, and initial user accounts."
      >
        <div className="rounded-xl border border-line bg-surface-elevated p-6">
          <p className="text-sm font-medium text-primary">Registration wizard</p>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                1
              </span>
              Company details and registration number
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                2
              </span>
              Service sites and waste categories
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                3
              </span>
              Admin users and go-live date
            </li>
          </ol>
        </div>
      </SystemPageContent>
    </AppShell>
  );
}
