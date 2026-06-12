"use client";

import { Zap } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { PublicStoreItem, StoreQuality } from "@/lib/artist";
import { CountdownInline } from "@/components/site/countdown-inline";
import { StoreBuyButton } from "@/components/site/store-buy-button";
import { toUploadPath } from "@/lib/media";

const rarityStyles: Record<StoreQuality, { badge: string; border: string }> = {
  COMMON: { badge: "bg-muted text-muted-foreground", border: "border-border" },
  RARE: { badge: "bg-rarity-rare text-white", border: "border-rarity-rare/60" },
  EPIC: { badge: "bg-rarity-epic text-white", border: "border-rarity-epic/60" },
  // Legendary badge is gold → needs dark text (our primary-foreground is white).
  LEGENDARY: { badge: "bg-rarity-legendary text-foreground", border: "border-rarity-legendary" },
};

function formatPrice(item: PublicStoreItem): string {
  if (item.priceMode === "POINTS") {
    return item.pointsPrice != null ? item.pointsPrice.toLocaleString("en-US") : "—";
  }
  if (item.priceAmountCents == null) {
    return "—";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: item.currencyCode || "USD",
    }).format(item.priceAmountCents / 100);
  } catch {
    return `${(item.priceAmountCents / 100).toFixed(2)} ${item.currencyCode ?? ""}`;
  }
}

// Store card with rarity styling + status badges + Buy button (when buyable).
export function StoreItemCard({
  item,
  artistSlug,
  isAuthenticated,
  viewerBalance,
  viewerRank,
}: {
  item: PublicStoreItem;
  artistSlug: string;
  isAuthenticated: boolean;
  // Buyer's current balance/rank — seed the purchase dialog before its preview
  // loads (the server preview then overrides).
  viewerBalance: number;
  viewerRank: number | null;
}) {
  // "Coming soon" needs a now-comparison — runs in an effect, never in render
  // (React 19 purity); setState deferred via queueMicrotask.
  const [comingSoon, setComingSoon] = useState(false);
  useEffect(() => {
    const t = item.salesStartAt ? new Date(item.salesStartAt).getTime() : Number.NaN;
    queueMicrotask(() => setComingSoon(Number.isFinite(t) && t > Date.now()));
  }, [item.salesStartAt]);

  const styles = rarityStyles[item.quality];
  const isLegendary = item.quality === "LEGENDARY";
  const hasBonus = item.loyaltyPoints > 0;
  const soldOut = item.stockCount !== null && item.stockCount <= 0;
  const leftCount =
    item.stockCount !== null &&
    item.leftAlert !== null &&
    item.stockCount > 0 &&
    item.stockCount <= item.leftAlert
      ? item.stockCount
      : null;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border-2 bg-card ${styles.border} ${
        isLegendary ? "legendary-glow" : ""
      }`}
    >
      <div className="relative">
        {hasBonus ? (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-1 bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground">
            Bonus Reward
            <Zap className="size-3 fill-current" aria-hidden />
            {item.loyaltyPoints.toLocaleString("en-US")}
          </div>
        ) : null}

        {item.imageUrl ? (
          <div className="relative aspect-square w-full bg-muted">
            <Image
              src={toUploadPath(item.imageUrl)}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Narrow cards (≤ 3-col): status + countdown don't fit the text rows, so
            show them as a full-width bar on the image bottom. Solid colour keeps it
            legible over any image (black/white). Desktop (lg) keeps them inline. */}
        {comingSoon ? (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-1.5 whitespace-nowrap bg-primary px-2 py-1 text-primary-foreground lg:hidden">
            <span className="text-[11px] font-bold">Coming Soon</span>
            <CountdownInline
              endsAt={item.salesStartAt}
              prefix="·"
              className="text-[11px] font-medium text-primary-foreground/85"
            />
          </div>
        ) : soldOut ? (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center whitespace-nowrap bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground lg:hidden">
            Sold Out
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="line-clamp-1 break-words font-heading text-sm font-semibold">{item.title}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${styles.badge}`}
          >
            {item.quality.toLowerCase()}
          </span>
          {!soldOut && leftCount !== null ? (
            <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              {leftCount} left
            </span>
          ) : null}
          {comingSoon ? (
            <span className="ml-auto hidden rounded bg-navbar px-2 py-0.5 text-[10px] font-bold text-navbar-foreground lg:inline-flex">
              Coming Soon
            </span>
          ) : soldOut ? (
            <span className="ml-auto hidden rounded bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground lg:inline-flex">
              Sold Out
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center font-heading text-sm font-bold ${
              item.priceMode === "POINTS" ? "text-points" : "text-foreground"
            }`}
          >
            {item.priceMode === "POINTS" ? (
              <Zap className="mr-0.5 size-3.5 fill-points" aria-hidden />
            ) : null}
            {formatPrice(item)}
          </span>
          {comingSoon ? (
            <CountdownInline
              endsAt={item.salesStartAt}
              className="hidden text-[11px] font-medium text-muted-foreground lg:inline"
            />
          ) : null}
          {/* On lg the countdown takes the slot for coming-soon items; below lg
              the status lives on the image, so the (disabled) cart shows here. */}
          <span className={comingSoon ? "lg:hidden" : undefined}>
            <StoreBuyButton
              variant="icon"
              artistSlug={artistSlug}
              storeItemId={item.id}
              priceMode={item.priceMode}
              itemTitle={item.title}
              initialBalance={viewerBalance}
              initialCurrentRank={viewerRank}
              loyaltyAward={item.loyaltyPoints}
              pointsCost={item.priceMode === "POINTS" ? (item.pointsPrice ?? 0) : 0}
              isAuthenticated={isAuthenticated}
              disabled={soldOut || comingSoon}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
