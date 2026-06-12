import { type NextRequest, NextResponse } from "next/server";

import { apiUrl } from "@/lib/api";

// Thin proxy: the Google button links here (same-origin), and we 302 to
// api-public's start (which owns state/PKCE + Redis). Keeps the api-public URL
// off the client and the user-facing auth URLs on the BFF.
export function GET(req: NextRequest): NextResponse {
  const artist = req.nextUrl.searchParams.get("artist");
  const ref = req.nextUrl.searchParams.get("ref");
  const params = new URLSearchParams();
  if (artist) {
    params.set("artist", artist);
  }
  if (ref) {
    params.set("ref", ref);
  }
  const query = params.toString();
  return NextResponse.redirect(apiUrl(`/auth/google/start${query ? `?${query}` : ""}`));
}
