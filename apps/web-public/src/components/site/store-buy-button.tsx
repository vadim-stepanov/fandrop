"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { useArtistAuthModal } from "@/components/auth/artist-auth-modal-controller";
import { PurchaseAnimationDialog } from "@/components/site/purchase-animation-dialog";
import {
  executePurchaseAction,
  previewPurchaseAction,
  type PurchasePreview,
} from "@/app/artist/[slug]/store/actions";

type StoreBuyButtonProps = {
  artistSlug: string;
  storeItemId: string;
  priceMode: "MONEY" | "POINTS";
  itemTitle: string;
  initialBalance: number;
  initialCurrentRank: number | null;
  loyaltyAward: number;
  pointsCost: number;
  // When false, Buy opens the auth modal instead of the purchase dialog (the
  // preview would 401 and hang the dialog on that error).
  isAuthenticated: boolean;
  variant?: "default" | "icon";
  // Sold out → render the cart non-interactive (icon variant only).
  disabled?: boolean;
};

export function StoreBuyButton({
  artistSlug,
  storeItemId,
  priceMode,
  itemTitle,
  initialBalance,
  initialCurrentRank,
  loyaltyAward,
  pointsCost,
  isAuthenticated,
  variant = "default",
  disabled = false,
}: StoreBuyButtonProps) {
  const { open: openAuthModal } = useArtistAuthModal();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PurchasePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirming, startConfirm] = useTransition();

  const closeDialog = useCallback(() => {
    if (confirming) {
      return;
    }
    setOpen(false);
    setPreview(null);
    setErrorMessage(null);
  }, [confirming]);

  const handleOpen = useCallback(async () => {
    if (!isAuthenticated) {
      // Not signed in — open the auth modal; after sign-in the user clicks Buy
      // again and goes through the real flow.
      openAuthModal();
      return;
    }
    setOpen(true);
    setPreview(null);
    setErrorMessage(null);

    const result = await previewPurchaseAction({ artistSlug, storeItemId });
    if (result.kind === "error") {
      setErrorMessage(result.reason);
      return;
    }
    setPreview(result.preview);
  }, [isAuthenticated, openAuthModal, artistSlug, storeItemId]);

  const handleConfirm = useCallback(() => {
    startConfirm(async () => {
      const result = await executePurchaseAction({ artistSlug, storeItemId });
      if (result.kind === "error") {
        setErrorMessage(result.reason);
        return;
      }
      // Success: close. The navbar balance widget animates on the refreshed
      // balance; the leaderboard / (future) inventory re-render too.
      setOpen(false);
      setPreview(null);
      setErrorMessage(null);
      router.refresh();
    });
  }, [artistSlug, storeItemId, router]);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={disabled ? undefined : handleOpen}
          disabled={disabled}
          aria-label={disabled ? `${itemTitle} sold out` : `Buy ${itemTitle}`}
          className={
            disabled
              ? "flex size-7 cursor-not-allowed items-center justify-center rounded-full bg-muted text-muted-foreground"
              : "flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110"
          }
        >
          <ShoppingCart className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110"
        >
          {priceMode === "POINTS" ? "Claim with points" : "Buy item"}
        </button>
      )}

      <PurchaseAnimationDialog
        open={open}
        confirming={confirming}
        itemTitle={itemTitle}
        startBalance={initialBalance}
        loyaltyAward={loyaltyAward}
        pointsCost={pointsCost}
        previewLoaded={preview !== null}
        currentRank={preview?.currentRank ?? initialCurrentRank}
        predictedRank={preview?.predictedRank ?? null}
        nextRankTarget={preview?.nextRankTarget ?? null}
        errorMessage={errorMessage}
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
