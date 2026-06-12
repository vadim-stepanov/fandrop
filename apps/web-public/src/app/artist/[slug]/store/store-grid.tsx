"use client";

import { useState } from "react";

import { StoreItemCard } from "@/components/store/store-item-card";
import type { PublicStoreItem, StoreCategory } from "@/lib/artist";

const FILTERS: Array<{ key: "ALL" | StoreCategory; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "MERCH", label: "Merch" },
  { key: "DIGITAL", label: "Digital" },
  { key: "EXPERIENCES", label: "Experiences" },
];

// Small per-artist catalog → fetch all once, filter client-side (no URL params,
// no server pagination).
export function StoreGrid({
  items,
  artistSlug,
  isAuthenticated,
  viewerBalance,
  viewerRank,
}: {
  items: PublicStoreItem[];
  artistSlug: string;
  isAuthenticated: boolean;
  viewerBalance: number;
  viewerRank: number | null;
}) {
  const [filter, setFilter] = useState<"ALL" | StoreCategory>("ALL");
  const shown = filter === "ALL" ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              filter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              artistSlug={artistSlug}
              isAuthenticated={isAuthenticated}
              viewerBalance={viewerBalance}
              viewerRank={viewerRank}
            />
          ))}
        </div>
      )}
    </>
  );
}
