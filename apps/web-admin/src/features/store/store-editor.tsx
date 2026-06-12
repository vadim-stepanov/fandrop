import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CountdownInline } from "@/components/countdown-inline";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";

import {
  getListStoreItemsQueryKey,
  useCreateStoreItem,
  useUpdateStoreItem,
} from "@/api/generated/store/store";
import type { StoreItemResponseDto } from "@/api/generated/model";
import {
  FieldHeader,
  dirtyFieldClass,
  labelText,
  labelTextWithHint,
} from "@/components/field-label";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TITLE_MAX = 160;
const CURRENCY_MAX = 3;

const CATEGORIES = ["MERCH", "DIGITAL", "EXPERIENCES"] as const;
const QUALITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;
const PRICE_MODES = ["MONEY", "POINTS"] as const;

type Category = (typeof CATEGORIES)[number];
type Quality = (typeof QUALITIES)[number];
type PriceMode = (typeof PRICE_MODES)[number];

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

// Empty string → null (unlimited / no-value); otherwise truncated integer.
function toInt(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toCents(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function StoreEditor({ slug, item }: { slug: string; item?: StoreItemResponseDto }) {
  const isEdit = Boolean(item);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: getListStoreItemsQueryKey() });
  const backToList = () => void navigate({ to: "/admin/$slug/store", params: { slug } });
  // Set before the post-create redirect so the unsaved-guard doesn't block our
  // own navigation to the new item's edit page.
  const navBypass = useRef(false);

  const createMutation = useCreateStoreItem({
    mutation: {
      onSuccess: (created) => {
        queryClient.setQueryData<StoreItemResponseDto[]>(getListStoreItemsQueryKey(), (old) =>
          old ? [...old, created] : [created],
        );
        invalidate();
        toast.success("Item created");
        navBypass.current = true;
        void navigate({
          to: "/admin/$slug/store/$itemId",
          params: { slug, itemId: created.id },
        });
      },
      onError: () => toast.error("Failed to create item"),
    },
  });
  const updateMutation = useUpdateStoreItem({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Item saved");
      },
      onError: () => toast.error("Failed to save item"),
    },
  });

  const [title, setTitle] = useState(item?.title ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [category, setCategory] = useState<Category>((item?.category as Category) ?? "MERCH");
  const [quality, setQuality] = useState<Quality>((item?.quality as Quality) ?? "COMMON");
  const [priceMode, setPriceMode] = useState<PriceMode>((item?.priceMode as PriceMode) ?? "MONEY");
  const [priceAmount, setPriceAmount] = useState(
    item?.priceAmountCents != null ? (item.priceAmountCents / 100).toFixed(2) : "",
  );
  const [currencyCode, setCurrencyCode] = useState(item?.currencyCode ?? "USD");
  const [pointsPrice, setPointsPrice] = useState(
    item?.pointsPrice != null ? String(item.pointsPrice) : "",
  );
  const [loyaltyPoints, setLoyaltyPoints] = useState(String(item?.loyaltyPoints ?? 0));
  const [stockCount, setStockCount] = useState(
    item?.stockCount != null ? String(item.stockCount) : "",
  );
  const [leftAlert, setLeftAlert] = useState(item?.leftAlert != null ? String(item.leftAlert) : "");
  const [salesStartAt, setSalesStartAt] = useState(toDateTimeLocalValue(item?.salesStartAt));
  const [featuredPos, setFeaturedPos] = useState(String(item?.featuredPos ?? 0));
  const [isVisible, setIsVisible] = useState(item?.isVisible ?? true);

  const changed = {
    title: title !== (item?.title ?? ""),
    imageUrl: imageUrl !== (item?.imageUrl ?? ""),
    category: category !== ((item?.category as Category) ?? "MERCH"),
    quality: quality !== ((item?.quality as Quality) ?? "COMMON"),
    priceMode: priceMode !== ((item?.priceMode as PriceMode) ?? "MONEY"),
    priceAmount:
      priceAmount !==
      (item?.priceAmountCents != null ? (item.priceAmountCents / 100).toFixed(2) : ""),
    currencyCode: currencyCode !== (item?.currencyCode ?? "USD"),
    pointsPrice: pointsPrice !== (item?.pointsPrice != null ? String(item.pointsPrice) : ""),
    loyaltyPoints: loyaltyPoints !== String(item?.loyaltyPoints ?? 0),
    stockCount: stockCount !== (item?.stockCount != null ? String(item.stockCount) : ""),
    leftAlert: leftAlert !== (item?.leftAlert != null ? String(item.leftAlert) : ""),
    salesStartAt: salesStartAt !== toDateTimeLocalValue(item?.salesStartAt),
    featuredPos: featuredPos !== String(item?.featuredPos ?? 0),
    isVisible: isVisible !== (item?.isVisible ?? true),
  };
  const dirty = Object.values(changed).some(Boolean);
  useUnsavedGuard(dirty, navBypass);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const priceValid =
    priceMode === "MONEY"
      ? priceAmount.trim() !== "" && Number.isFinite(Number(priceAmount))
      : pointsPrice.trim() !== "" && Number.isFinite(Number(pointsPrice));
  const canSubmit = title.trim() !== "" && priceValid && (!isEdit || dirty) && !isPending;
  const mark = (c: boolean) => isEdit && c;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      title: title.trim(),
      imageUrl: orNull(imageUrl),
      category,
      quality,
      priceMode,
      priceAmountCents: priceMode === "MONEY" ? toCents(priceAmount) : null,
      currencyCode: priceMode === "MONEY" ? orNull(currencyCode) : null,
      pointsPrice: priceMode === "POINTS" ? toInt(pointsPrice) : null,
      loyaltyPoints: toInt(loyaltyPoints) ?? 0,
      stockCount: toInt(stockCount),
      leftAlert: toInt(leftAlert),
      salesStartAt: salesStartAt ? new Date(salesStartAt).toISOString() : null,
      featuredPos: toInt(featuredPos) ?? 0,
      isVisible,
    };
    if (item) {
      updateMutation.mutate({ id: item.id, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={backToList}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Store items
        </button>
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? "Saving…" : isEdit ? "Save" : "Create item"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)]">
        <div className="grid gap-4">
          <div>
            <FieldHeader
              htmlFor="s-title"
              label={labelTextWithHint(
                "Title",
                mark(changed.title),
                "Product name on the Store card. Renders on one line.",
              )}
              current={title.length}
              max={TITLE_MAX}
            />
            <Input
              id="s-title"
              value={title}
              maxLength={TITLE_MAX}
              className={dirtyFieldClass(mark(changed.title))}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1">{labelText("Image", mark(changed.imageUrl))}</Label>
              <ImageUploadField
                currentUrl={imageUrl}
                onChange={setImageUrl}
                labelDimensions="Recommended 600×600"
              />
            </div>
            <div className="grid content-start gap-4">
              <div>
                <Label htmlFor="s-category" className="mb-1">
                  {labelText("Category", mark(changed.category))}
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger
                    id="s-category"
                    className={dirtyFieldClass(mark(changed.category))}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="s-quality" className="mb-1">
                  {labelTextWithHint(
                    "Quality",
                    mark(changed.quality),
                    "Rarity tier — card border/accent colour. Use LEGENDARY sparingly.",
                  )}
                </Label>
                <Select value={quality} onValueChange={(v) => setQuality(v as Quality)}>
                  <SelectTrigger id="s-quality" className={dirtyFieldClass(mark(changed.quality))}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="s-price-mode" className="mb-1">
                {labelTextWithHint(
                  "Price mode",
                  mark(changed.priceMode),
                  "MONEY → set price + currency. POINTS → set points price. Any category works either way.",
                )}
              </Label>
              <Select value={priceMode} onValueChange={(v) => setPriceMode(v as PriceMode)}>
                <SelectTrigger
                  id="s-price-mode"
                  className={dirtyFieldClass(mark(changed.priceMode))}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {priceMode === "MONEY" ? (
              <>
                <div>
                  <Label htmlFor="s-price" className="mb-1">
                    {labelText("Price", mark(changed.priceAmount))}
                  </Label>
                  <Input
                    id="s-price"
                    inputMode="decimal"
                    placeholder="25.00"
                    value={priceAmount}
                    className={dirtyFieldClass(mark(changed.priceAmount))}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = Number(v);
                      if (v !== "" && Number.isFinite(n) && n >= 0) {
                        setPriceAmount(n.toFixed(2));
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="s-currency" className="mb-1">
                    {labelText("Currency", mark(changed.currencyCode))}
                  </Label>
                  <Input
                    id="s-currency"
                    value={currencyCode}
                    maxLength={CURRENCY_MAX}
                    className={dirtyFieldClass(mark(changed.currencyCode))}
                    onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="s-points" className="mb-1">
                  {labelText("Points price", mark(changed.pointsPrice))}
                </Label>
                <Input
                  id="s-points"
                  type="number"
                  min={0}
                  value={pointsPrice}
                  className={dirtyFieldClass(mark(changed.pointsPrice))}
                  onChange={(e) => setPointsPrice(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="s-loyalty" className="mb-1">
                {labelTextWithHint(
                  "Loyalty points",
                  mark(changed.loyaltyPoints),
                  "Points earned on each purchase of this item. 0 = no reward.",
                )}
              </Label>
              <Input
                id="s-loyalty"
                type="number"
                min={0}
                value={loyaltyPoints}
                className={dirtyFieldClass(mark(changed.loyaltyPoints))}
                onChange={(e) => setLoyaltyPoints(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-stock" className="mb-1">
                {labelTextWithHint(
                  "Stock count",
                  mark(changed.stockCount),
                  "Inventory cap. Empty = unlimited. 0 → Sold Out.",
                )}
              </Label>
              <Input
                id="s-stock"
                type="number"
                min={0}
                placeholder="∞"
                value={stockCount}
                className={dirtyFieldClass(mark(changed.stockCount))}
                onChange={(e) => setStockCount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-left-alert" className="mb-1">
                {labelTextWithHint(
                  "Left alert",
                  mark(changed.leftAlert),
                  "Show an “N left” badge once stock drops to/below this. Empty = no badge.",
                )}
              </Label>
              <Input
                id="s-left-alert"
                type="number"
                min={0}
                value={leftAlert}
                className={dirtyFieldClass(mark(changed.leftAlert))}
                onChange={(e) => setLeftAlert(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="s-sales-start" className="mb-1">
                {labelTextWithHint(
                  "Sales start at",
                  mark(changed.salesStartAt),
                  "Item shows as “Coming Soon” until this time. Empty = available now.",
                )}
              </Label>
              <Input
                id="s-sales-start"
                type="datetime-local"
                value={salesStartAt}
                className={dirtyFieldClass(mark(changed.salesStartAt))}
                onChange={(e) => setSalesStartAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-featured" className="mb-1">
                {labelTextWithHint(
                  "Featured position",
                  mark(changed.featuredPos),
                  "Position in the Store block on Home. 0 = not shown on Home.",
                )}
              </Label>
              <Input
                id="s-featured"
                type="number"
                min={0}
                value={featuredPos}
                className={dirtyFieldClass(mark(changed.featuredPos))}
                onChange={(e) => setFeaturedPos(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="s-visible"
              checked={isVisible}
              onCheckedChange={(v) => setIsVisible(v === true)}
            />
            <Label htmlFor="s-visible">
              {labelTextWithHint(
                "Visible",
                mark(changed.isVisible),
                "If off, fans don't see this item (it stays admin-only).",
              )}
            </Label>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <StoreItemPreview
            title={title}
            imageUrl={imageUrl}
            quality={quality}
            priceLabel={
              priceMode === "MONEY"
                ? formatMoney(priceAmount, currencyCode)
                : pointsPrice.trim() !== ""
                  ? `${Number(pointsPrice).toLocaleString("en-US")} pts`
                  : "—"
            }
            loyaltyPoints={toInt(loyaltyPoints) ?? 0}
            stockCount={toInt(stockCount)}
            leftAlert={toInt(leftAlert)}
            salesStartAt={salesStartAt}
          />
        </div>
      </div>
    </form>
  );
}

function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (amount.trim() === "" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

const RARITY_RING: Record<Quality, string> = {
  COMMON: "border-zinc-300",
  RARE: "border-sky-400",
  EPIC: "border-violet-400",
  LEGENDARY: "border-amber-400",
};

const RARITY_BADGE: Record<Quality, string> = {
  COMMON: "bg-zinc-100 text-zinc-600",
  RARE: "bg-sky-100 text-sky-700",
  EPIC: "bg-violet-100 text-violet-700",
  LEGENDARY: "bg-amber-100 text-amber-700",
};

function PreviewBadge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>
      {children}
    </span>
  );
}

function StoreItemPreview({
  title,
  imageUrl,
  quality,
  priceLabel,
  loyaltyPoints,
  stockCount,
  leftAlert,
  salesStartAt,
}: {
  title: string;
  imageUrl: string;
  quality: Quality;
  priceLabel: string;
  loyaltyPoints: number;
  stockCount: number | null;
  leftAlert: number | null;
  salesStartAt: string;
}) {
  // "now" comparison runs in an effect (never in render — React 19 purity);
  // setState deferred via queueMicrotask (no sync setState in effect body).
  const [comingSoon, setComingSoon] = useState(false);
  useEffect(() => {
    const t = salesStartAt ? new Date(salesStartAt).getTime() : Number.NaN;
    queueMicrotask(() => setComingSoon(Number.isFinite(t) && t > Date.now()));
  }, [salesStartAt]);

  const soldOut = stockCount !== null && stockCount <= 0;
  const leftCount =
    stockCount !== null && leftAlert !== null && stockCount > 0 && stockCount <= leftAlert
      ? stockCount
      : null;
  const hasBonus = loyaltyPoints > 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border-2 bg-card",
        RARITY_RING[quality],
      )}
    >
      <div className="relative">
        {hasBonus ? (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-1 bg-foreground px-2 py-1 text-[11px] font-bold text-background">
            Bonus Reward +{loyaltyPoints.toLocaleString("en-US")}
          </div>
        ) : null}
        {imageUrl ? (
          <img src={imageUrl} alt="" className="aspect-square w-full bg-muted object-cover" />
        ) : (
          <div className="grid aspect-square w-full place-items-center bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{title || "Untitled item"}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <PreviewBadge tone={RARITY_BADGE[quality]}>{quality}</PreviewBadge>
          {!soldOut && leftCount !== null ? (
            <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              {leftCount} left
            </span>
          ) : null}
          {comingSoon ? (
            <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Coming Soon
            </span>
          ) : soldOut ? (
            <span className="ml-auto rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              Sold Out
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{priceLabel}</span>
          {comingSoon ? (
            <CountdownInline endsAt={salesStartAt || null} />
          ) : (
            <span
              aria-hidden
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                soldOut ? "bg-muted text-muted-foreground" : "bg-foreground text-background",
              )}
            >
              <ShoppingCart className="size-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
