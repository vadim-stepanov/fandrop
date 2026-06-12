import { type NextRequest, NextResponse } from "next/server";

import { apiUrl } from "@/lib/api";
import { setSession } from "@/lib/session";

// Google redirects the browser here. We exchange the code via api-public
// (business logic) and set the session cookies (BFF owns them), then land the
// user on the artist Home. On any failure → home, unauthenticated.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { origin, searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${origin}/`);
  }

  const res = await fetch(apiUrl("/auth/google/exchange"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, state }),
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.redirect(`${origin}/`);
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    sid: string;
    user: { email: string };
    artistSlug?: string;
  };
  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    sid: data.sid,
    email: data.user.email,
  });

  const dest = data.artistSlug ? `${origin}/artist/${data.artistSlug}` : `${origin}/`;
  return NextResponse.redirect(dest);
}
