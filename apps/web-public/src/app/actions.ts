"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiUrl } from "@/lib/api";
import { clearSession } from "@/lib/session";

export async function logout(artistSlug?: string): Promise<void> {
  const refresh = await clearSession();
  if (refresh) {
    // Forward the refresh token so api-public revokes the session server-side.
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      headers: { cookie: `refresh_token=${refresh}` },
      cache: "no-store",
    });
  }
  // Land on the artist Home: member-only pages (profile/store/quests) 404 for
  // anon, so staying on the current page would show a 404 after sign-out.
  if (artistSlug) {
    redirect(`/artist/${artistSlug}`);
  }
  revalidatePath("/artist/[slug]", "page");
}
