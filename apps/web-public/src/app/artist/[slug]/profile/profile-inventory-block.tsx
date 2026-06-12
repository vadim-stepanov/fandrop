"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import type { StoreQuality } from "@/lib/artist";
import { toUploadPath } from "@/lib/media";

export const INVENTORY_COLLAPSED_MOBILE = 4;
export const INVENTORY_COLLAPSED_DESKTOP = 8;

const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

// React 19-safe hydrated flag.
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// SSR assumes desktop; mobile clients shift one frame after hydration.
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches,
    () => false,
  );
}

const rarityBadgeClass: Record<StoreQuality, string> = {
  COMMON: "bg-muted text-muted-foreground",
  RARE: "bg-rarity-rare text-white",
  EPIC: "bg-rarity-epic text-white",
  LEGENDARY: "bg-rarity-legendary text-foreground",
};

export type InventoryGroup = {
  storeItemId: string;
  itemTitle: string;
  imageUrl: string | null;
  quality: StoreQuality;
  quantity: number;
  latestAcquiredAt: string;
};

function formatAcquiredAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function InventoryCard({ group }: { group: InventoryGroup }) {
  const isLegendary = group.quality === "LEGENDARY";
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border bg-card ${
        isLegendary ? "legendary-glow border-rarity-legendary" : "border-border"
      }`}
    >
      <div className="relative aspect-square bg-muted">
        {group.imageUrl ? (
          <Image
            src={toUploadPath(group.imageUrl)}
            alt={group.itemTitle}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <span
          className={`absolute right-2 top-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize md:text-xs ${rarityBadgeClass[group.quality]}`}
        >
          {group.quality.toLowerCase()}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 p-2.5 md:p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-heading text-xs font-semibold md:text-sm">
            {group.itemTitle}
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
            {formatAcquiredAt(group.latestAcquiredAt)}
          </p>
        </div>
        {group.quantity > 1 ? (
          <span className="whitespace-nowrap rounded-md border border-border bg-muted px-1.5 py-0.5 font-heading text-[10px] font-semibold text-foreground md:text-xs">
            ×{group.quantity}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function InventoryBlock({ groups }: { groups: InventoryGroup[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hydrated = useHasHydrated();
  const isMobile = useIsMobile();

  const collapseAt =
    hydrated && isMobile ? INVENTORY_COLLAPSED_MOBILE : INVENTORY_COLLAPSED_DESKTOP;

  const mainCards = groups.slice(0, collapseAt);
  const extraCards = groups.slice(collapseAt);
  const hasOverflow = extraCards.length > 0;

  return (
    <section className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 flex items-center justify-between gap-3 bg-background/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Inventory{" "}
          <span className="text-sm font-normal text-muted-foreground">({groups.length})</span>
        </h2>
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 md:hidden"
          >
            <ChevronDown
              className={`size-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
            <span>{isExpanded ? "Show less" : "Show more"}</span>
          </button>
        ) : null}
      </div>

      {groups.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {mainCards.map((group) => (
              <InventoryCard key={group.storeItemId} group={group} />
            ))}
          </div>

          {hasOverflow ? (
            <div
              aria-hidden={!isExpanded}
              className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 md:gap-4 md:pt-4 lg:grid-cols-4">
                  {extraCards.map((group) => (
                    <InventoryCard key={group.storeItemId} group={group} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          No items yet. Buy something in the store to fill your inventory.
        </div>
      )}

      {hasOverflow ? (
        <div className="hidden items-center gap-4 pt-2 md:flex">
          <div className="h-px flex-1 bg-border" />
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <span>{isExpanded ? "Show less" : `Show ${extraCards.length} more`}</span>
            <ChevronDown
              className={`size-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : null}
    </section>
  );
}
