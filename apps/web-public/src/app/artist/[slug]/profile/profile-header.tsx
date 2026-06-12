import { Zap } from "lucide-react";
import type { ReactNode } from "react";

import { ProfileAvatar } from "./profile-avatar";

export function ProfileHeader({
  displayName,
  email,
  avatarUrl,
  artistSlug,
  pointsBalance,
  totalEarned,
  socialsSlot,
}: {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  artistSlug: string;
  pointsBalance: number;
  totalEarned: number;
  // Socials block — sits to the right of the info on desktop, below on mobile.
  socialsSlot?: ReactNode;
}) {
  // Hide email when it equals displayName (displayName fell back to the email
  // local-part) — avoids rendering the same string twice.
  const showEmail = email !== null && email !== displayName;

  return (
    <section className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
      <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} artistSlug={artistSlug} />

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:items-start">
        <h1 className="break-words font-heading text-2xl font-bold text-foreground md:text-3xl">
          {displayName}
        </h1>

        {showEmail ? (
          <p className="-mt-1 break-all text-xs text-muted-foreground md:text-sm">{email}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 md:justify-start">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-2 pr-2.5">
            <Zap className="size-3.5 fill-points text-points" />
            <span className="font-heading text-xs font-bold tabular-nums">
              {pointsBalance.toLocaleString("en-US")}
            </span>
            <span className="text-[10px] text-muted-foreground">current</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-2 pr-2.5">
            <Zap className="size-3.5 fill-muted-foreground text-muted-foreground" />
            <span className="font-heading text-xs font-bold tabular-nums">
              {totalEarned.toLocaleString("en-US")}
            </span>
            <span className="text-[10px] text-muted-foreground">total earned</span>
          </div>
        </div>
      </div>

      {socialsSlot}
    </section>
  );
}
