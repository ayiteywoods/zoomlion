import { AppShell } from "@/components/app-shell";
import { CustomSystemDetail } from "@/components/custom-system-detail";

type CustomCompanyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomCompanyPage({ params }: CustomCompanyPageProps) {
  const { id } = await params;

  return (
    <AppShell system="companies">
      <CustomSystemDetail systemId={id} />
    </AppShell>
  );
}
