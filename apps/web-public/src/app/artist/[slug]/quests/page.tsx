import { notFound } from "next/navigation";

import { getQuests } from "@/lib/artist";
import { getAccessToken, getSessionEmail } from "@/lib/session";

import { QuestsGrid } from "./quests-grid";

// Member-only: the full Quests list is hidden from anons — direct
// hits 404 (also hides existence from crawlers). The Home teaser stays public.
export default async function ArtistQuestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [email, accessToken] = await Promise.all([getSessionEmail(), getAccessToken()]);
  if (!email) {
    notFound();
  }
  const quests = await getQuests(slug, accessToken);

  return (
    <div className="page-fade-in py-10">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">Quests</h1>
      <QuestsGrid quests={quests} artistSlug={slug} />
    </div>
  );
}
