"use client";

import { ArrowDown, ArrowUp, PartyPopper, Trophy, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ANIMATION_MS = 1800;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type NextRankTarget = {
  rank: number;
  pointsNeeded: number;
};

type PurchaseAnimationDialogProps = {
  open: boolean;
  confirming: boolean;
  itemTitle: string;

  // Known client-side immediately (no server wait).
  startBalance: number;
  loyaltyAward: number;
  pointsCost: number;

  // Server-dependent — null until preview arrives.
  previewLoaded: boolean;
  currentRank: number | null;
  predictedRank: number | null;
  nextRankTarget: NextRankTarget | null;

  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PurchaseAnimationDialog(props: PurchaseAnimationDialogProps) {
  if (!props.open) {
    return null;
  }
  // Key restarts the animation if the user opens a different item without closing.
  const animationKey = `${props.itemTitle}-${props.startBalance}-${props.loyaltyAward}-${props.pointsCost}`;
  return <PurchaseAnimationDialogInner key={animationKey} {...props} />;
}

function PurchaseAnimationDialogInner({
  confirming,
  itemTitle,
  startBalance,
  loyaltyAward,
  pointsCost,
  previewLoaded,
  currentRank,
  predictedRank,
  nextRankTarget,
  errorMessage,
  onConfirm,
  onCancel,
}: PurchaseAnimationDialogProps) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Balance delta is known client-side — animate immediately, no preview wait.
  const endBalance = startBalance + loyaltyAward - pointsCost;
  const balanceDelta = endBalance - startBalance;

  const positionsGained =
    currentRank !== null && predictedRank !== null ? currentRank - predictedRank : null;

  useEffect(() => {
    if (errorMessage) {
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      setProgress(easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [errorMessage]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirming) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [confirming, onCancel]);

  const animatedBalance = Math.round(startBalance + balanceDelta * progress);
  const sparkLeftPct = progress * 100;

  const showFinalCard = done && previewLoaded && positionsGained !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-animation-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !confirming) {
          onCancel();
        }
      }}
    >
      <div className="relative w-[90vw] max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        <div className="relative bg-gradient-to-br from-primary-soft via-white to-white px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {pointsCost > 0 ? "Claiming" : "Buying"}
              </p>
              <p
                id="purchase-animation-title"
                className="mt-0.5 truncate text-base font-extrabold text-zinc-900"
              >
                {itemTitle}
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-points/20 px-3 py-1.5">
              <Trophy className="size-4 text-points" />
              <span className="text-lg font-extrabold leading-none tabular-nums text-points">
                {animatedBalance.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="px-6 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pb-2 pt-6">
              <div className="relative">
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-points to-red-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center"
                  aria-hidden
                >
                  <div className="w-full border-t border-dashed border-white/50" />
                </div>
                {/* Spark riding the bar like a lit fuse — white-hot head + gold
                    glow + a trailing streak. Replaces the artist-specific car. */}
                <div
                  className="pointer-events-none absolute top-1/2"
                  style={{ left: `${sparkLeftPct}%`, transform: "translate(-50%, -50%)" }}
                  aria-hidden
                >
                  <span className="absolute right-1/2 top-1/2 h-[3px] w-9 -translate-y-1/2 rounded-full bg-gradient-to-l from-points to-transparent opacity-90 blur-[1.5px]" />
                  <span
                    className="block size-2.5 rounded-full bg-white"
                    style={{
                      boxShadow:
                        "0 0 6px 2px rgba(245,177,37,0.95), 0 0 16px 6px rgba(245,177,37,0.5)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between text-[10px] text-zinc-500">
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Zap className="size-3 fill-points text-points" />
                  {startBalance.toLocaleString("en-US")}
                </span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Zap className="size-3 fill-points text-points" />
                  {endBalance.toLocaleString("en-US")}
                </span>
              </div>
            </div>

            <div className="flex min-h-[170px] items-center justify-center px-6 py-6">
              {!showFinalCard ? (
                <CurrentRankView rank={currentRank} />
              ) : positionsGained! > 0 ? (
                <NewRankCard rank={predictedRank!} positionsGained={positionsGained!} tone="up" />
              ) : positionsGained! < 0 ? (
                <NewRankCard rank={predictedRank!} positionsGained={positionsGained!} tone="down" />
              ) : (
                <KeepRankCard rank={predictedRank!} nextRankTarget={nextRankTarget} />
              )}
            </div>
          </>
        )}

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              confirming || !!errorMessage || !done || !previewLoaded || predictedRank === null
            }
            className="brand-glow inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? "Processing…" : "Buy Now!"}
            {!confirming ? <PartyPopper className="size-4" /> : null}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="mt-1 h-10 w-full text-sm text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CurrentRankView({ rank }: { rank: number | null }) {
  return (
    <div className="animate-fade-in text-center">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Current Rank
      </p>
      <p className="text-5xl font-extrabold tabular-nums text-zinc-900">
        {rank === null ? "•••" : `#${rank}`}
      </p>
      <p className="mt-4 text-xs text-zinc-500">Climbing the leaderboard…</p>
    </div>
  );
}

function NewRankCard({
  rank,
  positionsGained,
  tone,
}: {
  rank: number;
  positionsGained: number;
  tone: "up" | "down";
}) {
  const absChange = Math.abs(positionsGained);
  const wordPosition = absChange === 1 ? "position" : "positions";

  if (tone === "up") {
    return (
      <div className="animate-scale-in w-full max-w-[260px] rounded-2xl border-2 border-green-400 bg-green-50 px-6 py-5 text-center shadow-xl">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-green-700">
          New Rank
        </p>
        <p className="mb-2 text-5xl font-extrabold tabular-nums text-zinc-900">#{rank}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          <ArrowUp className="size-3.5" />+{absChange} {wordPosition}
        </span>
      </div>
    );
  }

  return (
    <div className="animate-scale-in w-full max-w-[260px] rounded-2xl border-2 border-red-400 bg-red-50 px-6 py-5 text-center shadow-xl">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-red-700">New Rank</p>
      <p className="mb-2 text-5xl font-extrabold tabular-nums text-zinc-900">#{rank}</p>
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        <ArrowDown className="size-3.5" />−{absChange} {wordPosition}
      </span>
    </div>
  );
}

function KeepRankCard({
  rank,
  nextRankTarget,
}: {
  rank: number;
  nextRankTarget: NextRankTarget | null;
}) {
  return (
    <div className="animate-scale-in w-full max-w-[280px] rounded-2xl border-2 border-zinc-300 bg-zinc-50 px-6 py-5 text-center shadow-xl">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        You Keep Your Rank
      </p>
      <p className="mb-3 text-5xl font-extrabold tabular-nums text-zinc-900">#{rank}</p>
      {nextRankTarget ? (
        <p className="text-xs leading-snug text-zinc-600">
          You need{" "}
          <span className="font-bold tabular-nums text-zinc-900">
            {nextRankTarget.pointsNeeded.toLocaleString("en-US")}
          </span>{" "}
          more points to reach rank{" "}
          <span className="font-bold text-zinc-900">#{nextRankTarget.rank}</span>
        </p>
      ) : (
        <p className="text-xs text-zinc-600">You&apos;re at the top!</p>
      )}
    </div>
  );
}
