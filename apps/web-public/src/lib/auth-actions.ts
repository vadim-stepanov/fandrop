"use server";

import { apiUrl } from "@/lib/api";
import { getArtistHome } from "@/lib/artist";
import { setSession } from "@/lib/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  sid: string;
  user: { email: string };
}

export async function requestOtp(email: string): Promise<ActionResult> {
  const res = await fetch(apiUrl("/auth/otp/request"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, error: await errorMessage(res) };
  }
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  code: string,
  artistSlug?: string,
  referralCode?: string,
): Promise<ActionResult> {
  const res = await fetch(apiUrl("/auth/otp/verify"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code, artistSlug, referralCode }),
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, error: await errorMessage(res) };
  }
  const data = (await res.json()) as VerifyResponse;
  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    sid: data.sid,
    email: data.user.email,
  });
  return { ok: true };
}

// Current referral config for the auth modal. Re-read on modal open so the
// optional code field reflects admin toggles without a page reload (anon pages
// have no realtime). Reuses the public home fetch (no-store → always fresh).
export async function getReferralConfig(
  slug: string,
): Promise<{ enabled: boolean; rewardPoints: number }> {
  const home = await getArtistHome(slug);
  return {
    enabled: home?.referralEnabled ?? false,
    rewardPoints: home?.referralRewardPoints ?? 0,
  };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? "Something went wrong";
  } catch {
    return "Something went wrong";
  }
}
