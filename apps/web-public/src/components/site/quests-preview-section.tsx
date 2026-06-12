import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { QuestCard } from "@/components/quests/quest-card";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";
import type { PublicQuest } from "@/lib/artist";

// Home teaser: up to 4 featured quests in a 2×2 grid + "View all in Quests"
// (member-only link). Already-claimed quests are dropped server-side; the page
// renders nothing when there's nothing to show.
export function QuestsPreviewSection({
  title,
  subtitle,
  editHref,
  quests,
  slug,
  isAuthenticated,
}: {
  title: string;
  subtitle: string | null;
  editHref?: string;
  quests: PublicQuest[];
  slug: string;
  isAuthenticated: boolean;
}) {
  if (quests.length === 0) {
    return null;
  }

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

      {/* Full content width, one row of up to 3 (teaser) — matches other sections. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {quests.slice(0, 3).map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            artistSlug={slug}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {isAuthenticated ? (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/artist/${slug}/quests`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2 font-heading text-sm font-semibold text-foreground transition hover:bg-card"
          >
            View all in Quests
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
