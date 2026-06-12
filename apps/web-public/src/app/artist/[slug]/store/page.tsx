import { notFound } from "next/navigation";

import { getMyBalance, getStore } from "@/lib/artist";
import { getAccessToken, getSessionEmail } from "@/lib/session";

import { StoreGrid } from "./store-grid";

// Member-only: the full Store is hidden from anons — direct hits
// 404 (also hides existence from crawlers). The Home featured teaser stays public.
export default async function ArtistStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [email, accessToken] = await Promise.all([getSessionEmail(), getAccessToken()]);
  if (!email) {
    notFound();
  }
  const [items, balance] = await Promise.all([
    getStore(slug, accessToken),
    getMyBalance(slug, accessToken),
  ]);

  return (
    <div className="page-fade-in py-10">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">Store</h1>
      {/* Anon is 404'd above, so the viewer is always a signed-in member here.
          viewerRank is null — the purchase preview fills the real rank. */}
      <StoreGrid
        items={items}
        artistSlug={slug}
        isAuthenticated
        viewerBalance={balance ?? 0}
        viewerRank={null}
      />
    </div>
  );
}
