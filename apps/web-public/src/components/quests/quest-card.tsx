"use client";

import { Target, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { claimQuestAction, startQuestAction } from "@/app/artist/[slug]/quests/actions";
import { useArtistAuthModal } from "@/components/auth/artist-auth-modal-controller";
import { CountdownInline } from "@/components/site/countdown-inline";
import type { PublicQuest } from "@/lib/artist";
import { toUploadPath } from "@/lib/media";

// One quest. Start (opens the link + marks complete), Claim (credits points), or
// the terminal "Completed" state. Anons get the auth modal on Start.
export function QuestCard({
  quest,
  artistSlug,
  isAuthenticated,
}: {
  quest: PublicQuest;
  artistSlug: string;
  isAuthenticated: boolean;
}) {
  const { open: openAuthModal } = useArtistAuthModal();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // "Coming soon" needs a now-comparison — effect only (React 19 purity).
  const [comingSoon, setComingSoon] = useState(false);
  useEffect(() => {
    const t = quest.availableAt ? new Date(quest.availableAt).getTime() : Number.NaN;
    queueMicrotask(() => setComingSoon(Number.isFinite(t) && t > Date.now()));
  }, [quest.availableAt]);

  const handleStart = useCallback(() => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (comingSoon) {
      return;
    }
    window.open(quest.link, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      const result = await startQuestAction({ artistSlug, questId: quest.id });
      if (result.kind === "error") {
        toast.error(result.reason);
        return;
      }
      router.refresh();
    });
  }, [isAuthenticated, openAuthModal, comingSoon, quest.link, quest.id, artistSlug, router]);

  const handleClaim = useCallback(() => {
    startTransition(async () => {
      const result = await claimQuestAction({ artistSlug, questId: quest.id });
      if (result.kind === "error") {
        toast.error(result.reason);
        return;
      }
      toast.success(`+${result.amount.toLocaleString("en-US")} points claimed`);
      router.refresh();
    });
  }, [artistSlug, quest.id, router]);

  const claimed = quest.status === "CLAIMED";
  const claimable = quest.status === "COMPLETED";

  return (
    <div
      className={`flex gap-3 rounded-xl border bg-card p-3 ${
        claimable ? "border-points/60 bg-points/5" : "border-border"
      } ${claimed ? "opacity-60" : ""}`}
    >
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        {quest.imageUrl ? (
          <Image
            src={toUploadPath(quest.imageUrl)}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <Target className="size-5" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-1 break-words font-heading text-sm font-semibold">{quest.title}</p>
        {quest.description ? (
          <p className="line-clamp-1 break-words text-xs text-muted-foreground">
            {quest.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-points">
            <Zap className="size-3.5 fill-current" aria-hidden />
            {quest.rewardPoints.toLocaleString("en-US")}
          </span>

          {claimed ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              Completed
            </span>
          ) : comingSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Coming Soon
              <CountdownInline
                endsAt={quest.availableAt}
                prefix="·"
                className="text-muted-foreground"
              />
            </span>
          ) : claimable ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleClaim}
              className="rounded-full bg-points px-3 py-1 text-xs font-bold text-foreground transition hover:brightness-95 disabled:opacity-60"
            >
              {pending ? "…" : "Claim points"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleStart}
              className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "…" : "Start quest"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
