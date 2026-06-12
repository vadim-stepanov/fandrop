import { cookies } from "next/headers";

// Next is the BFF: it owns httpOnly session cookies on :3000. The api-public
// tokens come back in the response body and are stored here.
const COOKIE = {
  access: "fd_access",
  refresh: "fd_refresh",
  sid: "fd_sid",
  email: "fd_email",
} as const;

const MAX_AGE = 30 * 24 * 60 * 60;

function baseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  sid: string;
  email: string;
}

export async function setSession(tokens: SessionTokens): Promise<void> {
  const store = await cookies();
  store.set(COOKIE.access, tokens.accessToken, baseOptions());
  store.set(COOKIE.refresh, tokens.refreshToken, baseOptions());
  store.set(COOKIE.sid, tokens.sid, baseOptions());
  store.set(COOKIE.email, tokens.email, baseOptions());
}

// Clears the session cookies and returns the refresh token (so the caller can
// tell api-public to revoke it) before deletion.
export async function clearSession(): Promise<string | undefined> {
  const store = await cookies();
  const refresh = store.get(COOKIE.refresh)?.value;
  for (const name of Object.values(COOKIE)) {
    store.delete(name);
  }
  return refresh;
}

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  if (!store.has(COOKIE.access)) {
    return null;
  }
  return store.get(COOKIE.email)?.value ?? null;
}

// Access token (for forwarding as Bearer to authed api-public routes). Null if
// the session cookie is absent.
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE.access)?.value ?? null;
}
