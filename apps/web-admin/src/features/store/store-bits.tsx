import type { StoreItemResponseDto } from "@/api/generated/model";
import { cn } from "@/lib/utils";

export const RARITY_BADGE: Record<StoreItemResponseDto["quality"], string> = {
  COMMON: "bg-zinc-100 text-zinc-600",
  RARE: "bg-sky-100 text-sky-700",
  EPIC: "bg-violet-100 text-violet-700",
  LEGENDARY: "bg-amber-100 text-amber-700",
};

export function StatusPill({ visible }: { visible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        visible ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
      )}
    >
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

export function formatStorePrice(item: StoreItemResponseDto): string {
  if (item.priceMode === "POINTS") {
    return item.pointsPrice != null ? `${item.pointsPrice.toLocaleString("en-US")} pts` : "—";
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
