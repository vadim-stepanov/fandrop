"use server";

import { apiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export type NextRankTarget = { rank: number; pointsNeeded: number };

export type PurchasePreview = {
  currentBalance: number;
  currentRank: number;
  projectedBalance: number;
  predictedRank: number;
  pointsCost: number;
  loyaltyAward: number;
  affordable: boolean;
  nextRankTarget: NextRankTarget | null;
};

export type PurchaseResult = {
  newBalance: number;
  newRank: number;
  inventoryItemId: string;
};

type PurchaseInput = { artistSlug: string; storeItemId: string };

async function errorReason(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return typeof data.message === "string" ? data.message : "Something went wrong";
  } catch {
    return "Something went wrong";
  }
}

// Thin HTTP wrappers to api-public (NestJS owns the purchase logic). Both are
// member-only — they forward the access token.
export async function previewPurchaseAction({
  artistSlug,
  storeItemId,
}: PurchaseInput): Promise<
  { kind: "ok"; preview: PurchasePreview } | { kind: "error"; reason: string }
> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/store/${storeItemId}/purchase-preview`), {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  return { kind: "ok", preview: (await res.json()) as PurchasePreview };
}

export async function executePurchaseAction({
  artistSlug,
  storeItemId,
}: PurchaseInput): Promise<
  { kind: "ok"; result: PurchaseResult } | { kind: "error"; reason: string }
> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/store/${storeItemId}/purchase`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  return { kind: "ok", result: (await res.json()) as PurchaseResult };
}
