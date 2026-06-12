"use server";

import { revalidatePath } from "next/cache";

import { apiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

type SocialActionResult = { kind: "ok" } | { kind: "error"; reason: string };

type AvatarActionResult =
  | { kind: "ok"; avatarUrl: string | null }
  | { kind: "error"; reason: string };

type SocialActionInput = {
  artistSlug: string;
  artistSocialLinkId: string;
  externalHandleOrUrl: string;
};

async function errorReason(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return typeof data.message === "string" ? data.message : "Something went wrong";
  } catch {
    return "Something went wrong";
  }
}

// Thin HTTP wrappers to api-public (NestJS owns the socials logic). Member-only —
// they forward the access token.
export async function connectSocial({
  artistSlug,
  artistSocialLinkId,
  externalHandleOrUrl,
}: SocialActionInput): Promise<SocialActionResult> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(
    apiUrl(`/artists/${artistSlug}/me/socials/${artistSocialLinkId}/connect`),
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ externalHandleOrUrl }),
      cache: "no-store",
    },
  );
  return res.ok ? { kind: "ok" } : { kind: "error", reason: await errorReason(res) };
}

// Forward the cropped avatar (multipart) to api-public — it stores the file +
// sets User.avatarUrl (wins over Google).
export async function uploadAvatarAction(
  artistSlug: string,
  formData: FormData,
): Promise<AvatarActionResult> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { kind: "error", reason: "No file provided" };
  }
  const forward = new FormData();
  forward.append("file", file);
  const res = await fetch(apiUrl(`/artists/${artistSlug}/me/avatar`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: forward,
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  const data = (await res.json()) as { avatarUrl: string | null };
  revalidatePath(`/artist/${artistSlug}/profile`);
  return { kind: "ok", avatarUrl: data.avatarUrl };
}

// Drop the uploaded avatar → fall back to the Google avatar (if any).
export async function removeAvatarAction(artistSlug: string): Promise<AvatarActionResult> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/me/avatar`), {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  const data = (await res.json()) as { avatarUrl: string | null };
  revalidatePath(`/artist/${artistSlug}/profile`);
  return { kind: "ok", avatarUrl: data.avatarUrl };
}

export async function editSocial({
  artistSlug,
  artistSocialLinkId,
  externalHandleOrUrl,
}: SocialActionInput): Promise<SocialActionResult> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/me/socials/${artistSocialLinkId}`), {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ externalHandleOrUrl }),
    cache: "no-store",
  });
  return res.ok ? { kind: "ok" } : { kind: "error", reason: await errorReason(res) };
}
