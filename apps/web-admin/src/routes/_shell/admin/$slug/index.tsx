import { createFileRoute } from "@tanstack/react-router";

import { useGetArtistSettings } from "@/api/generated/artist-settings/artist-settings";
import { AdminsSection } from "@/features/artist-settings/admins-section";
import { BrandingEditor } from "@/features/artist-settings/branding-editor";
import { PageHeader } from "@/components/ui/page-header";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/_shell/admin/$slug/")({
  component: Overview,
});

function Overview() {
  const admin = useAuthStore((s) => s.admin);
  const { data: settings, isLoading } = useGetArtistSettings();

  return (
    <div className="pb-12">
      <PageHeader
        eyebrow="Artist"
        title={settings?.name ?? admin?.artist.name ?? "Artist"}
        description={settings ? `/${settings.slug}` : "Branding and admins."}
      />

      {isLoading || !settings ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-6">
          <BrandingEditor settings={settings} />
          <AdminsSection />
        </div>
      )}
    </div>
  );
}
