import { notFound } from "next/navigation";

import {
  getCanAdmin,
  getInventory,
  getMyAvatar,
  getMyReferral,
  getPointsSummary,
  getSocials,
  getTransactions,
  type PublicInventoryItem,
} from "@/lib/artist";
import { buildProfileEditHref } from "@/components/site/admin-edit-href";
import { getAccessToken, getSessionEmail } from "@/lib/session";

import { ProfileHeader } from "./profile-header";
import { InventoryBlock, type InventoryGroup } from "./profile-inventory-block";
import { ProfileReferralBlock } from "./profile-referral-block";
import { ProfileSocialsBlock } from "./profile-socials-block";
import { ProfileTransactionHistory } from "./profile-transaction-history";

function parseTxPage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// Collapse identical items (same store item) into one card with a quantity.
// storeItemId is null once the source item is deleted → each such row stands
// alone (keyed by inventory id).
function groupInventory(items: PublicInventoryItem[]): InventoryGroup[] {
  const map = new Map<string, InventoryGroup>();
  for (const item of items) {
    const key = item.storeItemId ?? `del-${item.id}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
      if (new Date(item.acquiredAt).getTime() > new Date(existing.latestAcquiredAt).getTime()) {
        existing.latestAcquiredAt = item.acquiredAt;
      }
    } else {
      map.set(key, {
        storeItemId: key,
        itemTitle: item.title,
        imageUrl: item.imageUrl,
        quality: item.quality,
        quantity: 1,
        latestAcquiredAt: item.acquiredAt,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestAcquiredAt).getTime() - new Date(a.latestAcquiredAt).getTime(),
  );
}

// Member-only: anon hits 404. Shell (navbar/footer/tabs) comes
// from the artist layout.
export default async function ArtistProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ txPage?: string }>;
}) {
  const { slug } = await params;
  const { txPage } = await searchParams;
  const page = parseTxPage(txPage);

  const [email, accessToken] = await Promise.all([getSessionEmail(), getAccessToken()]);
  if (!email) {
    notFound();
  }
  const [summary, inventory, transactions, socials, referral, canOpenAdmin, avatarUrl] =
    await Promise.all([
      getPointsSummary(slug, accessToken),
      getInventory(slug, accessToken),
      getTransactions(slug, accessToken, page),
      getSocials(slug, accessToken),
      getMyReferral(slug, accessToken),
      getCanAdmin(slug, accessToken),
      getMyAvatar(slug, accessToken),
    ]);

  const displayName = email.split("@")[0] || email;
  // Hide the block when the artist has opted out of referrals or set no reward.
  const showReferral = Boolean(referral?.enabled && referral.rewardPerReferral > 0);

  return (
    <div className="page-fade-in space-y-8 py-10">
      <ProfileHeader
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        artistSlug={slug}
        pointsBalance={summary.balance}
        totalEarned={summary.totalEarned}
        socialsSlot={<ProfileSocialsBlock artistSlug={slug} entries={socials} />}
      />
      <InventoryBlock groups={groupInventory(inventory)} />
      {showReferral && referral ? (
        <ProfileReferralBlock
          referralCode={referral.code}
          usersInvited={referral.usersInvited}
          pointsFromReferrals={referral.pointsFromReferrals}
          rewardPerReferral={referral.rewardPerReferral}
          editHref={canOpenAdmin ? buildProfileEditHref(slug) : undefined}
        />
      ) : null}
      <ProfileTransactionHistory
        artistSlug={slug}
        entries={transactions.entries}
        page={transactions.page}
        totalPages={transactions.totalPages}
      />
    </div>
  );
}
