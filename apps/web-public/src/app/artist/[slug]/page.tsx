import { notFound } from "next/navigation";

import {
  type PublicHomeSectionKey,
  getActivePromo,
  getArtistHome,
  getArtistPartners,
  getArtistRules,
  getCanAdmin,
  getLeaderboard,
  getQuestsFeatured,
  getStoreFeatured,
} from "@/lib/artist";
import { PromoHero } from "@/components/site/promo-hero";
import { buildPageEditHref, buildSectionEditHref } from "@/components/site/admin-edit-href";
import { AdminEditPageFab } from "@/components/site/admin-edit-shortcuts";
import { LeaderboardSection } from "@/components/site/leaderboard-section";
import { PartnersMarquee } from "@/components/site/partners-marquee";
import { QuestsPreviewSection } from "@/components/site/quests-preview-section";
import { RulesSection } from "@/components/site/rules-section";
import { StorePreviewSection } from "@/components/site/store-preview-section";
import { getAccessToken, getSessionEmail } from "@/lib/session";

const SECTION_LABELS: Record<PublicHomeSectionKey, string> = {
  PROMO: "Promo",
  RULES: "Rules",
  STORE: "Store",
  LEADERBOARD: "Leaderboard",
  PARTNERS: "Partners",
  QUESTS: "Quests",
};

export default async function ArtistHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [email, accessToken] = await Promise.all([getSessionEmail(), getAccessToken()]);
  const [artist, rules, promo, partners, leaderboard, storeFeatured, questsFeatured, canOpenAdmin] =
    await Promise.all([
      getArtistHome(slug),
      getArtistRules(slug),
      getActivePromo(slug),
      getArtistPartners(slug),
      getLeaderboard(slug, accessToken),
      getStoreFeatured(slug),
      getQuestsFeatured(slug, accessToken),
      getCanAdmin(slug, accessToken),
    ]);
  if (!artist) {
    notFound();
  }
  const isAuthenticated = Boolean(email);

  if (artist.sections.length === 0) {
    return (
      <div className="px-2 py-12">
        <p className="text-muted-foreground">This page has no visible sections yet.</p>
      </div>
    );
  }

  return (
    // Plain block + space-y so the full-bleed promo/partners keep their width;
    // contained sections sit inside the layout's max-w-5xl main.
    <div className="page-fade-in space-y-4 md:space-y-6">
      {artist.sections.map((section) => {
        const title = section.title ?? SECTION_LABELS[section.key];
        const subtitle = section.subtitle;
        // Admin-only pencil → the section's web-admin editor.
        const editHref = canOpenAdmin
          ? (buildSectionEditHref(slug, section.key) ?? undefined)
          : undefined;

        switch (section.key) {
          case "PROMO":
            return promo ? (
              <PromoHero
                key={section.key}
                variant={promo}
                artistName={artist.name}
                isAuthenticated={isAuthenticated}
                editHref={editHref}
              />
            ) : null;
          case "PARTNERS":
            return (
              <PartnersMarquee
                key={section.key}
                title={title}
                subtitle={subtitle}
                items={partners}
                editHref={editHref}
              />
            );
          case "RULES":
            return (
              <RulesSection
                key={section.key}
                title={title}
                subtitle={subtitle}
                items={rules}
                editHref={editHref}
              />
            );
          case "LEADERBOARD":
            return (
              <LeaderboardSection
                key={section.key}
                title={title}
                subtitle={subtitle}
                view={leaderboard}
                editHref={editHref}
              />
            );
          case "STORE":
            return (
              <StorePreviewSection
                key={section.key}
                title={title}
                subtitle={subtitle}
                items={storeFeatured}
                slug={slug}
                isAuthenticated={isAuthenticated}
                viewerBalance={leaderboard.myEntry?.points ?? 0}
                viewerRank={leaderboard.myEntry?.rank ?? null}
                editHref={editHref}
              />
            );
          case "QUESTS":
            // Hide the whole section when there's nothing to show (no featured /
            // all claimed) — the component returns null on an empty list.
            return (
              <QuestsPreviewSection
                key={section.key}
                title={title}
                subtitle={subtitle}
                quests={questsFeatured}
                slug={slug}
                isAuthenticated={isAuthenticated}
                editHref={editHref}
              />
            );
          default:
            return (
              <p key={section.key} className="py-10 text-center text-sm text-muted-foreground">
                {SECTION_LABELS[section.key]} content coming soon.
              </p>
            );
        }
      })}

      {/* Admin-only: open this whole page in web-admin. */}
      {canOpenAdmin ? <AdminEditPageFab href={buildPageEditHref(slug)} label="Edit page" /> : null}
    </div>
  );
}
