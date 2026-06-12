import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "./auth-store";

const PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL ?? "http://localhost:3001";
const ADMIN_URL = import.meta.env.VITE_API_ADMIN_URL ?? "http://localhost:3002";

export const publicApi = axios.create({ baseURL: `${PUBLIC_URL}/api/v1`, withCredentials: true });
// Bare origin (no /api): Orval-generated paths already include the /api/v1 prefix.
export const adminApi = axios.create({ baseURL: ADMIN_URL, withCredentials: true });

let refreshPromise: Promise<string | null> | null = null;

// Single-flight refresh: concurrent 401s share one /auth/refresh call (§6
// refresh queue). Uses bare axios to avoid interceptor recursion.
export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async (): Promise<string | null> => {
    try {
      const res = await axios.post<{ accessToken: string }>(
        `${PUBLIC_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true },
      );
      useAuthStore.getState().setAccessToken(res.data.accessToken);
      return res.data.accessToken;
    } catch (err) {
      // Only a real auth rejection (401) kills the session. Network errors /
      // 5xx (e.g. api-public restarting under `pnpm dev`) are transient —
      // don't log out; a retry recovers once the server is back.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        useAuthStore.getState().reset();
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function attachAuth(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return instance(original);
        }
      }
      return Promise.reject(error);
    },
  );
}

attachAuth(publicApi);
attachAuth(adminApi);
