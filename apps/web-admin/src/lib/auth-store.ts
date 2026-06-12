import { create } from "zustand";

export interface AdminContext {
  user: { id: string; email: string; avatarUrl: string | null };
  artist: { id: string; slug: string; name: string };
}

type AuthStatus = "loading" | "authed" | "anon";

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  admin: AdminContext | null;
  setAccessToken: (token: string | null) => void;
  setAdmin: (admin: AdminContext) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

// Access token lives in memory only (per §6); refresh is via the httpOnly
// cookie. Survives nothing on reload — restoreSession() rehydrates via refresh.
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  accessToken: null,
  admin: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setAdmin: (admin) => set({ admin, status: "authed" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "anon", accessToken: null, admin: null }),
}));
