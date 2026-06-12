"use server";

import { apiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

// Thin HTTP wrappers to api-public (NestJS owns the onboarding logic). Both are
// member-only and forward the access token. The modal calls claim on its first
// screen and complete on the final screen; both are idempotent server-side.

export async function claimWelcomeBonus(
  artistSlug: string,
): Promise<{ claimed: boolean; bonusAmount: number }> {
  const token = await getAccessToken();
  if (!token) {
    return { claimed: false, bonusAmount: 0 };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/me/onboarding/claim`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { claimed: false, bonusAmount: 0 };
  }
  return (await res.json()) as { claimed: boolean; bonusAmount: number };
}

export async function completeOnboarding(artistSlug: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }
  await fetch(apiUrl(`/artists/${artistSlug}/me/onboarding/complete`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}
