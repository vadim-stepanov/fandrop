"use server";

import { apiUrl } from "@/lib/api";
import type { QuestStatus } from "@/lib/artist";
import { getAccessToken } from "@/lib/session";

type QuestInput = { artistSlug: string; questId: string };

async function errorReason(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return typeof data.message === "string" ? data.message : "Something went wrong";
  } catch {
    return "Something went wrong";
  }
}

// Thin HTTP wrappers to api-public (NestJS owns the quest logic). Both member-only.
export async function startQuestAction({
  artistSlug,
  questId,
}: QuestInput): Promise<{ kind: "ok"; status: QuestStatus } | { kind: "error"; reason: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/quests/${questId}/start`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  const data = (await res.json()) as { status: QuestStatus };
  return { kind: "ok", status: data.status };
}

export async function claimQuestAction({
  artistSlug,
  questId,
}: QuestInput): Promise<{ kind: "ok"; amount: number } | { kind: "error"; reason: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { kind: "error", reason: "Please sign in to continue" };
  }
  const res = await fetch(apiUrl(`/artists/${artistSlug}/quests/${questId}/claim`), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { kind: "error", reason: await errorReason(res) };
  }
  const data = (await res.json()) as { claimed: boolean; amount: number };
  return { kind: "ok", amount: data.amount };
}
