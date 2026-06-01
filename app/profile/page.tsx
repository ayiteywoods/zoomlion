import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProfilePageContent } from "@/components/profile-page-content";

export default function ProfilePage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SiteHeader />
      <main className="relative min-h-0 flex-1 overflow-y-auto bg-surface">
        <ProfilePageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
