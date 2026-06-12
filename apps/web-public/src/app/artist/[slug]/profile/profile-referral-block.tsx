"use client";

import { Check, Copy, Share2, Users, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";

type ProfileReferralBlockProps = {
  referralCode: string;
  usersInvited: number;
  pointsFromReferrals: number;
  // Per-referral reward (both sides earn it) — shown as a +N badge by the title.
  rewardPerReferral: number;
  editHref?: string;
};

export function ProfileReferralBlock({
  referralCode,
  usersInvited,
  pointsFromReferrals,
  rewardPerReferral,
  editHref,
}: ProfileReferralBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied", { description: referralCode });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy", { description: "Try copying manually." });
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Share2 className="size-4" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">Referral Program</h2>
        {rewardPerReferral > 0 ? (
          <span
            className="rounded-full bg-points px-2 py-0.5 text-xs font-bold text-foreground"
            title="Points you earn each time a friend signs up with your code (your friend gets the same amount)"
          >
            +{rewardPerReferral.toLocaleString("en-US")}
          </span>
        ) : null}
        {editHref ? <AdminEditSectionLink href={editHref} label="Edit referral reward" /> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Your Referral Code</div>
          <div className="relative flex h-10 items-center rounded-md border border-border bg-background px-3">
            <span className="font-heading font-bold tracking-widest text-foreground">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              aria-label="Copy referral code"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Users Invited</div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3">
            <Users className="size-4 text-primary" />
            <span className="font-heading font-bold text-foreground">
              {usersInvited.toLocaleString("en-US")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Points from Referrals</div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3">
            <Zap className="size-4 fill-points text-points" />
            <span className="font-heading font-bold text-foreground">
              {pointsFromReferrals.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
