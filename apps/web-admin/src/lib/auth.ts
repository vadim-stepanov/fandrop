import axios from "axios";

import { me } from "../api/generated/me/me";
import { publicApi, refreshAccessToken } from "./api";
import { useAuthStore } from "./auth-store";

export async function requestOtp(email: string): Promise<void> {
  await publicApi.post("/auth/otp/request", { email });
}

export async function verifyOtp(email: string, code: string): Promise<void> {
  const res = await publicApi.post<{ accessToken: string }>("/auth/otp/verify", { email, code });
  useAuthStore.getState().setAccessToken(res.data.accessToken);
  await loadAdmin();
}

// Full-page navigation to start Google sign-in: api-public 302s to Google, which
// redirects back to /auth/google/callback in this SPA. mode=admin picks the
// admin redirect URI.
const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL ?? "http://localhost:3001";
export const googleAdminLoginUrl = `${API_PUBLIC_URL}/api/v1/auth/google/start?mode=admin`;

// Called by the callback route: exchange the code → access token (memory) +
// refresh cookie (set by api-public), then load the admin (403 if not an admin).
export async function completeGoogleLogin(code: string, state: string): Promise<void> {
  const res = await publicApi.post<{ accessToken: string }>("/auth/google/exchange", {
    code,
    state,
  });
  useAuthStore.getState().setAccessToken(res.data.accessToken);
  await loadAdmin();
}

async function loadAdmin(): Promise<void> {
  const admin = await me();
  useAuthStore.getState().setAdmin(admin);
}

// Generous budget (~30s) so a transient outage — api-public still booting
// after `pnpm dev` — is ridden out instead of logging the user out. Real
// auth failures (401/403) bail immediately; only a sustained outage gives up.
const RESTORE_RETRIES = 15;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Called once on app boot: rehydrate the session from the refresh cookie.
// The access token is in-memory, so every reload re-refreshes. A transient
// failure (api-public/api-admin still starting under `pnpm dev`) must NOT log
// the user out — refreshAccessToken only reset()s on a real 401, so we retry
// while the session is still alive and the failure looks transient.
export async function restoreSession(): Promise<void> {
  for (let attempt = 0; attempt <= RESTORE_RETRIES; attempt++) {
    const token = await refreshAccessToken();
    if (token) {
      try {
        await loadAdmin();
        return; // authed
      } catch (err) {
        // 403 = valid user but not this artist's admin → no admin access.
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          useAuthStore.getState().reset();
          return;
        }
        // else transient (api-admin not ready) → fall through to retry
      }
    }
    // A real 401 already reset() the store to "anon" — no session, stop.
    if (useAuthStore.getState().status === "anon") {
      return;
    }
    // Transient (server starting): back off (capped) and retry.
    if (attempt < RESTORE_RETRIES) {
      await delay(Math.min(2000, 500 * (attempt + 1)));
    }
  }
  // Still unreachable after retries — show login; a reload recovers once the
  // server is back up (the session cookie is untouched).
  useAuthStore.getState().setStatus("anon");
}

export async function logout(): Promise<void> {
  try {
    await publicApi.post("/auth/logout", {});
  } catch {
    // Ignore — clear local state regardless.
  }
  useAuthStore.getState().reset();
}
