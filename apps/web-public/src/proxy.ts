import { type NextRequest, NextResponse } from "next/server";

// Server-side access-token refresh for the BFF (Next 16 "proxy" convention,
// formerly middleware). Server Components can't set cookies during render, so we
// renew here (proxy runs before the render and can mutate both the request — so
// this render sees the fresh token — and the response — so the browser persists
// it). Proactive: when fd_access is expired but fd_refresh is still valid, swap
// for a fresh pair. One refresh per navigation (matcher targets the document,
// not assets) → no rotation race.

const ACCESS = "fd_access";
const REFRESH = "fd_refresh";
const SID = "fd_sid";
const EMAIL = "fd_email";

const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? "http://localhost:3001";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 30 * 24 * 60 * 60,
};

// Read a JWT's `exp` without verifying (api-public re-verifies). Treat anything
// unreadable as expired. 10s skew so we renew just before the edge.
function accessExpired(token: string | undefined): boolean {
  if (!token) {
    return true;
  }
  try {
    let b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(b64)) as { exp?: number };
    return !exp || Date.now() / 1000 >= exp - 10;
  } catch {
    return true;
  }
}

export async function proxy(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH)?.value;
  // Nothing to renew (anonymous), or the access token is still fresh.
  if (!refresh || !accessExpired(req.cookies.get(ACCESS)?.value)) {
    return NextResponse.next();
  }

  let renewed: { accessToken: string; refreshToken: string; sid: string } | null = null;
  let sessionDead = false;
  try {
    const res = await fetch(`${API_PUBLIC_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { cookie: `refresh_token=${refresh}` },
      cache: "no-store",
    });
    if (res.ok) {
      renewed = (await res.json()) as { accessToken: string; refreshToken: string; sid: string };
    } else if (res.status === 401) {
      // Genuinely invalid/expired session — drop our cookies so the page renders
      // cleanly as anonymous. Transient errors (5xx) leave cookies intact.
      sessionDead = true;
    }
  } catch {
    // api-public unreachable — leave cookies; the next navigation retries.
  }

  if (renewed) {
    req.cookies.set(ACCESS, renewed.accessToken);
    req.cookies.set(REFRESH, renewed.refreshToken);
    req.cookies.set(SID, renewed.sid);
    const response = NextResponse.next({ request: { headers: req.headers } });
    response.cookies.set(ACCESS, renewed.accessToken, COOKIE_OPTS);
    response.cookies.set(REFRESH, renewed.refreshToken, COOKIE_OPTS);
    response.cookies.set(SID, renewed.sid, COOKIE_OPTS);
    return response;
  }

  if (sessionDead) {
    for (const name of [ACCESS, REFRESH, SID, EMAIL]) {
      req.cookies.delete(name);
    }
    const response = NextResponse.next({ request: { headers: req.headers } });
    for (const name of [ACCESS, REFRESH, SID, EMAIL]) {
      response.cookies.delete(name);
    }
    return response;
  }

  return NextResponse.next();
}

// Only the artist pages render personalised data (balance widget, leaderboard
// "You" row). Assets / data requests are excluded so refresh runs once per nav.
export const config = {
  matcher: ["/artist/:path*"],
};
