"use client";

import { ChevronDown, ChevronUp, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import { Fragment, useState } from "react";

import type { LeaderboardEntry, LeaderboardSocial, LeaderboardView } from "@/lib/artist";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";
import { BrandIcon } from "@/components/site/brand-icon";
import { toUploadPath } from "@/lib/media";
import { brandSlugFor, externalHref } from "@/lib/socials/social-helpers";

const rankBorderColor: Record<number, string> = {
  1: "border-l-4 border-l-rank-gold",
  2: "border-l-4 border-l-rank-silver",
  3: "border-l-4 border-l-rank-bronze",
};

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return initials || "?";
}

// No stable id in our entries → identity by rank + name + points.
function sameEntry(a: LeaderboardEntry, b: LeaderboardEntry): boolean {
  return a.rank === b.rank && a.displayName === b.displayName && a.points === b.points;
}

function pointsLabel(points: number) {
  return points.toLocaleString("en-US");
}

// Connected socials as brand-icon links (new tab) — violet filled buttons with a
// white mark, matching the Profile connected style. Big enough to tap on mobile;
// unknown platforms are skipped.
function SocialBadges({ socials }: { socials: LeaderboardSocial[] }) {
  if (socials.length === 0) {
    return null;
  }
  return (
    // -ml-1 offsets the first icon's tap padding so it lines up with the name above.
    <div className="-ml-1 flex flex-wrap items-center gap-0.5 opacity-60">
      {socials.map((social) => {
        const slug = brandSlugFor(social.platformSlug);
        if (!slug) {
          return null;
        }
        return (
          <a
            key={social.platformSlug}
            href={externalHref(social.externalHandleOrUrl, social.platformSlug)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${social.platformLabel}: ${social.externalHandleOrUrl}`}
            title={`${social.platformLabel}: ${social.externalHandleOrUrl}`}
            className="inline-flex items-center justify-center rounded p-1 opacity-60"
          >
            <BrandIcon slug={slug} alt={social.platformLabel} className="size-5" />
          </a>
        );
      })}
    </div>
  );
}

function LeaderboardAvatar({ entry, rounded }: { entry: LeaderboardEntry; rounded: string }) {
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden ${rounded} bg-secondary`}
    >
      {entry.avatarUrl ? (
        <Image
          src={toUploadPath(entry.avatarUrl)}
          alt=""
          width={40}
          height={40}
          className="size-full object-cover"
        />
      ) : (
        <span className="font-heading text-xs font-bold text-secondary-foreground">
          {getInitials(entry.displayName)}
        </span>
      )}
    </div>
  );
}

function TopRow({ entry, isMine }: { entry: LeaderboardEntry; isMine: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${
        rankBorderColor[entry.rank] ?? ""
      }`}
    >
      <span className="w-6 text-center font-heading text-lg font-extrabold text-muted-foreground">
        {entry.rank}
      </span>
      <LeaderboardAvatar entry={entry} rounded="rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-bold">
          {isMine ? `You (${entry.displayName})` : entry.displayName}
        </p>
        <SocialBadges socials={entry.socials} />
      </div>
      <div className="flex items-center gap-1 font-heading text-sm font-bold text-points">
        <Zap className="size-3.5 fill-points" aria-hidden />
        {pointsLabel(entry.points)}
      </div>
    </div>
  );
}

function OtherRow({ entry, isMine }: { entry: LeaderboardEntry; isMine: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
        isMine ? "border border-rarity-rare/30 bg-user-highlight" : ""
      }`}
    >
      <span className="w-6 text-center font-heading text-sm font-semibold text-muted-foreground">
        {entry.rank}
      </span>
      <LeaderboardAvatar entry={entry} rounded="rounded-full" />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-heading text-sm ${isMine ? "font-bold" : "font-medium"}`}>
          {isMine ? `You (${entry.displayName})` : entry.displayName}
        </p>
        <SocialBadges socials={entry.socials} />
      </div>
      <div className="flex items-center gap-1 font-heading text-xs font-semibold text-points">
        <Zap className="size-3 fill-points" aria-hidden />
        {pointsLabel(entry.points)}
      </div>
    </div>
  );
}

function TrophyHint({ pointsNeeded, topN }: { pointsNeeded: number; topN: number }) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground">
      <Trophy className="size-3" aria-hidden />
      <span>
        You need {pointsLabel(pointsNeeded)} points to get to top {topN}
      </span>
    </div>
  );
}

export function LeaderboardSection({
  title,
  subtitle,
  editHref,
  view,
}: {
  title: string;
  subtitle: string | null;
  editHref?: string;
  view: LeaderboardView;
}) {
  const { entries, myEntry, topExpandedCount: topN, expandedByDefault } = view;
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);

  const canExpand = entries.length > topN;
  const topEntries = entries.slice(0, topN);
  const expandedOthers = entries.slice(topN);

  const isMyInTop = myEntry ? topEntries.some((e) => sameEntry(e, myEntry)) : false;
  const isMyInOthers = myEntry ? expandedOthers.some((e) => sameEntry(e, myEntry)) : false;
  const showMyPlaceCollapsed = myEntry !== null && !isMyInTop;
  const showMyPlaceExpanded = myEntry !== null && !isMyInTop && !isMyInOthers;

  const cutoffPoints = topEntries.length === topN ? topEntries[topN - 1].points : null;
  const pointsToTopN =
    myEntry && cutoffPoints !== null && myEntry.points < cutoffPoints
      ? cutoffPoints - myEntry.points + 1
      : null;

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

      <div>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No ranked fans yet.
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-3">
              {topEntries.map((entry) => (
                <TopRow
                  key={entry.rank}
                  entry={entry}
                  isMine={!!myEntry && sameEntry(entry, myEntry)}
                />
              ))}
            </div>

            {showMyPlaceCollapsed && myEntry ? (
              <div
                className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out"
                style={{
                  gridTemplateRows: isExpanded ? "0fr" : "1fr",
                  opacity: isExpanded ? 0 : 1,
                }}
                aria-hidden={isExpanded}
              >
                <div className="min-h-0 space-y-1">
                  <div className="py-1 text-center text-xs tracking-widest text-muted-foreground">
                    • • •
                  </div>
                  <OtherRow entry={myEntry} isMine />
                  {pointsToTopN !== null ? (
                    <TrophyHint pointsNeeded={pointsToTopN} topN={topN} />
                  ) : null}
                </div>
              </div>
            ) : null}

            {expandedOthers.length > 0 || showMyPlaceExpanded ? (
              <div
                className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out"
                style={{
                  gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  opacity: isExpanded ? 1 : 0,
                }}
                aria-hidden={!isExpanded}
              >
                <div className="min-h-0">
                  <p className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Other fans
                  </p>
                  <div className="space-y-1">
                    {expandedOthers.map((entry) => {
                      const isMine = !!myEntry && sameEntry(entry, myEntry);
                      return (
                        <Fragment key={entry.rank}>
                          <OtherRow entry={entry} isMine={isMine} />
                          {isMine && pointsToTopN !== null ? (
                            <TrophyHint pointsNeeded={pointsToTopN} topN={topN} />
                          ) : null}
                        </Fragment>
                      );
                    })}
                    {showMyPlaceExpanded && myEntry ? (
                      <>
                        <div className="py-1 text-center text-xs tracking-widest text-muted-foreground">
                          • • •
                        </div>
                        <OtherRow entry={myEntry} isMine />
                        {pointsToTopN !== null ? (
                          <TrophyHint pointsNeeded={pointsToTopN} topN={topN} />
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {canExpand ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2 font-heading text-sm font-semibold text-foreground transition hover:bg-card"
                >
                  {isExpanded ? "Show less" : "Show more"}
                  {isExpanded ? (
                    <ChevronUp className="size-4" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
