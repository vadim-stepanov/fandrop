"use client";

import { useState } from "react";

import { QuestCard } from "@/components/quests/quest-card";
import type { PublicQuest } from "@/lib/artist";

type StatusFilter = "ALL" | "AVAILABLE" | "UNCLAIMED" | "COMPLETED";

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "AVAILABLE", label: "Available" },
  { key: "UNCLAIMED", label: "Unclaimed" },
  { key: "COMPLETED", label: "Completed" },
];

function matchesStatus(quest: PublicQuest, filter: StatusFilter): boolean {
  switch (filter) {
    case "AVAILABLE":
      return quest.status === "NOT_STARTED" || quest.status === "IN_PROGRESS";
    case "UNCLAIMED":
      return quest.status === "COMPLETED";
    case "COMPLETED":
      return quest.status === "CLAIMED";
    default:
      return true;
  }
}

// Small per-artist set → all loaded once, filtered client-side. Newest-first
// (API order) in every filter.
export function QuestsGrid({ quests, artistSlug }: { quests: PublicQuest[]; artistSlug: string }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const shown = quests.filter((quest) => matchesStatus(quest, status));

  return (
    <>
      {/* One row on every breakpoint — capsules shrink on mobile to fit. */}
      <div className="mb-6 flex gap-1.5 sm:gap-2">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition sm:px-4 sm:py-1.5 sm:text-sm ${
              status === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quests in this view.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((quest) => (
            <QuestCard key={quest.id} quest={quest} artistSlug={artistSlug} isAuthenticated />
          ))}
        </div>
      )}
    </>
  );
}
