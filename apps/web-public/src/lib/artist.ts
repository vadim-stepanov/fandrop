import { apiUrl } from "./api";

export type PublicHomeSectionKey =
  | "PROMO"
  | "RULES"
  | "STORE"
  | "LEADERBOARD"
  | "PARTNERS"
  | "QUESTS";

export interface PublicHomeSection {
  key: PublicHomeSectionKey;
  title: string | null;
  subtitle: string | null;
}

export interface PublicArtistHome {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  referralEnabled: boolean;
  referralRewardPoints: number;
  sections: PublicHomeSection[];
}

export interface PublicRule {
  title: string;
  body: string | null;
}

export interface PublicPromo {
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ctaText: string | null;
  bannerUrl: string | null;
  videoUrl: string | null;
  bannerUrlAnon: string | null;
  eyebrow: string | null;
  timerEndsAt: string | null;
}

// Fetches the artist Home from api-public. Returns null on 404 so the page
// can render notFound(). no-store: always fresh (admin edits show on reload);
// ISR/realtime is a later optimization.
export async function getArtistHome(slug: string): Promise<PublicArtistHome | null> {
  const res = await fetch(apiUrl(`/artists/${slug}/home`), { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load artist home (${res.status})`);
  }
  return res.json() as Promise<PublicArtistHome>;
}

// Rule items of the artist's RULES section (empty if hidden / none).
export async function getArtistRules(slug: string): Promise<PublicRule[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/rules`), { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicRule[]>;
}

// Active variant of the artist's PROMO section. Null when none/hidden — the
// endpoint returns an empty body in that case.
export async function getActivePromo(slug: string): Promise<PublicPromo | null> {
  const res = await fetch(apiUrl(`/artists/${slug}/promo`), { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as PublicPromo) : null;
}

export interface PublicPartner {
  name: string;
  logoUrl: string | null;
  externalUrl: string | null;
}

// The signed-in viewer's points balance at this artist. Null when not signed
// in or the access token is rejected (BFF doesn't refresh on the server side —
// the widget just hides). Forwards the access token as Bearer.
export async function getMyBalance(
  slug: string,
  accessToken: string | null,
): Promise<number | null> {
  if (!accessToken) {
    return null;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/balance`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { balance: number };
  return data.balance;
}

// The signed-in viewer's avatar (uploaded, else Google) — for the navbar widget.
export async function getMyAvatar(
  slug: string,
  accessToken: string | null,
): Promise<string | null> {
  if (!accessToken) {
    return null;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/avatar`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { avatarUrl: string | null };
  return data.avatarUrl;
}

// Whether the signed-in viewer is an admin of this artist (drives the admin-jump
// pencils/FAB + the "Admin" menu item). False for anonymous viewers.
export async function getCanAdmin(slug: string, accessToken: string | null): Promise<boolean> {
  if (!accessToken) {
    return false;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/can-admin`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return false;
  }
  const data = (await res.json()) as { canOpenAdmin: boolean };
  return data.canOpenAdmin;
}

export interface OnboardingState {
  isMember: boolean;
  hasSeenOnboarding: boolean;
  welcomeBonus: number;
}

// First-join onboarding state for the signed-in viewer (drives the welcome
// modal). Null when not signed in or the token is rejected → no modal.
export async function getMyOnboarding(
  slug: string,
  accessToken: string | null,
): Promise<OnboardingState | null> {
  if (!accessToken) {
    return null;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/onboarding`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as OnboardingState;
}

export interface ReferralView {
  enabled: boolean;
  code: string;
  rewardPerReferral: number;
  usersInvited: number;
  pointsFromReferrals: number;
}

// The signed-in viewer's referral panel at this artist (code + stats). Null when
// not signed in or the token is rejected.
export async function getMyReferral(
  slug: string,
  accessToken: string | null,
): Promise<ReferralView | null> {
  if (!accessToken) {
    return null;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/referral`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as ReferralView;
}

// Visible partner items of the artist's PARTNERS section (empty if hidden/none).
export async function getArtistPartners(slug: string): Promise<PublicPartner[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/partners`), { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicPartner[]>;
}

export type StoreCategory = "MERCH" | "DIGITAL" | "EXPERIENCES";
export type StoreQuality = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type StorePriceMode = "MONEY" | "POINTS";

export interface PublicStoreItem {
  id: string;
  title: string;
  imageUrl: string | null;
  category: StoreCategory;
  quality: StoreQuality;
  priceMode: StorePriceMode;
  priceAmountCents: number | null;
  currencyCode: string | null;
  pointsPrice: number | null;
  loyaltyPoints: number;
  stockCount: number | null;
  leftAlert: number | null;
  salesStartAt: string | null;
}

// All visible items of the artist's Store (the member-only Store page). Requires
// a Bearer token — anons are 404'd at the page level before this runs. Empty on
// error.
export async function getStore(
  slug: string,
  accessToken: string | null,
): Promise<PublicStoreItem[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/store`), {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicStoreItem[]>;
}

// Top-N featured items for the Store block on Home. Empty on error / none.
export async function getStoreFeatured(slug: string): Promise<PublicStoreItem[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/store/featured`), { cache: "no-store" });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicStoreItem[]>;
}

// ── Quests (member-only page + public Home teaser) ────────────────────────

export type QuestStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CLAIMED";

export interface PublicQuest {
  id: string;
  title: string;
  description: string | null;
  link: string;
  imageUrl: string | null;
  rewardPoints: number;
  availableAt: string | null;
  // The viewer's progress (NOT_STARTED for anon / not yet started).
  status: QuestStatus;
}

// All visible quests of the artist (member-only page). Requires a Bearer token —
// anons are 404'd at the page level before this runs. Empty on error.
export async function getQuests(slug: string, accessToken: string | null): Promise<PublicQuest[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/quests`), {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicQuest[]>;
}

// Featured quests for the Home block. Public; forwards the token (if any) so the
// API can attach status and drop already-claimed quests. Empty on error / none.
export async function getQuestsFeatured(
  slug: string,
  accessToken: string | null,
): Promise<PublicQuest[]> {
  const res = await fetch(apiUrl(`/artists/${slug}/quests/featured`), {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicQuest[]>;
}

// Count of the viewer's unclaimed quest rewards (navbar badge). 0 for anon.
export async function getQuestsUnclaimedCount(
  slug: string,
  accessToken: string | null,
): Promise<number> {
  if (!accessToken) {
    return 0;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/quests-unclaimed`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return 0;
  }
  const data = (await res.json()) as { count: number };
  return data.count;
}

export interface LeaderboardSocial {
  platformSlug: string;
  platformLabel: string;
  externalHandleOrUrl: string;
}

export interface LeaderboardEntry {
  avatarUrl: string | null;
  rank: number;
  displayName: string;
  points: number;
  socials: LeaderboardSocial[];
}

export interface LeaderboardView {
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  topExpandedCount: number;
  expandedByDefault: boolean;
}

// Top members by points balance + collapse/expand config + the viewer's own row.
// Forwards the access token (if any) as Bearer so the API can include `myEntry`.
// Safe default on error.
export async function getLeaderboard(
  slug: string,
  accessToken: string | null,
): Promise<LeaderboardView> {
  const res = await fetch(apiUrl(`/artists/${slug}/leaderboard`), {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    return { entries: [], myEntry: null, topExpandedCount: 3, expandedByDefault: false };
  }
  return res.json() as Promise<LeaderboardView>;
}

// ── Profile (member-only) ─────────────────────────────────────────────────

export interface PublicInventoryItem {
  id: string;
  storeItemId: string | null;
  title: string;
  imageUrl: string | null;
  category: StoreCategory;
  quality: StoreQuality;
  acquiredAt: string;
}

export interface PointsSummary {
  balance: number;
  totalEarned: number;
}

export type TransactionKind =
  | "WELCOME_BONUS"
  | "REFERRAL_REWARD"
  | "PURCHASE_REWARD"
  | "POINTS_SPEND"
  | "ADMIN_ADJUSTMENT"
  | "QUEST_REWARD";

export interface TransactionEntry {
  id: string;
  amount: number;
  kind: TransactionKind;
  description: string | null;
  createdAt: string;
}

export interface TransactionPage {
  entries: TransactionEntry[];
  page: number;
  totalPages: number;
}

// Member's owned items (newest first). Empty for anon / on error.
export async function getInventory(
  slug: string,
  accessToken: string | null,
): Promise<PublicInventoryItem[]> {
  if (!accessToken) {
    return [];
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/inventory`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<PublicInventoryItem[]>;
}

export async function getPointsSummary(
  slug: string,
  accessToken: string | null,
): Promise<PointsSummary> {
  const fallback: PointsSummary = { balance: 0, totalEarned: 0 };
  if (!accessToken) {
    return fallback;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/points-summary`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return res.ok ? (res.json() as Promise<PointsSummary>) : fallback;
}

export async function getTransactions(
  slug: string,
  accessToken: string | null,
  page: number,
): Promise<TransactionPage> {
  const fallback: TransactionPage = { entries: [], page: 1, totalPages: 1 };
  if (!accessToken) {
    return fallback;
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/transactions?page=${page}`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return res.ok ? (res.json() as Promise<TransactionPage>) : fallback;
}

export interface ProfileSocialEntry {
  artistSocialLinkId: string;
  platformSlug: string;
  platformLabel: string;
  platformIcon: string;
  connectBonus: number;
  connection: { externalHandleOrUrl: string } | null;
}

// The artist's visible social platforms + the viewer's connection per link.
export async function getSocials(
  slug: string,
  accessToken: string | null,
): Promise<ProfileSocialEntry[]> {
  if (!accessToken) {
    return [];
  }
  const res = await fetch(apiUrl(`/artists/${slug}/me/socials`), {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json() as Promise<ProfileSocialEntry[]>;
}
