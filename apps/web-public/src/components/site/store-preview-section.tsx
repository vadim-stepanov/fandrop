import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { PublicStoreItem } from "@/lib/artist";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";
import { StoreItemCard } from "@/components/store/store-item-card";

// Home teaser: featured items grid + "View all in Store". The full Store page is
// member-only, so the link only shows for signed-in viewers.
export function StorePreviewSection({
  title,
  subtitle,
  editHref,
  items,
  slug,
  isAuthenticated,
  viewerBalance,
  viewerRank,
}: {
  title: string;
  subtitle: string | null;
  editHref?: string;
  items: PublicStoreItem[];
  slug: string;
  isAuthenticated: boolean;
  viewerBalance: number;
  viewerRank: number | null;
}) {
  return (
    <section className="py-7 md:py-14">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h2 className="line-clamp-1 break-words font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          {title}
          {editHref ? (
            <span className="ml-2 align-middle">
              <AdminEditSectionLink href={editHref} label={`Edit ${title}`} />
            </span>
          ) : null}
        </h2>
        {subtitle ? (
          <p className="mt-2 line-clamp-1 break-words text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No featured store items yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {items.map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                artistSlug={slug}
                isAuthenticated={isAuthenticated}
                viewerBalance={viewerBalance}
                viewerRank={viewerRank}
              />
            ))}
          </div>
          {isAuthenticated ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/artist/${slug}/store`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2 font-heading text-sm font-semibold text-foreground transition hover:bg-card"
              >
                View all in Store
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
