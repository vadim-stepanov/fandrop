import type { Response } from "express";

import {
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
  SID_COOKIE,
  SID_COOKIE_PATH,
} from "./auth.constants";
import type { TokenPair } from "./auth.types";

// httpOnly session cookies on the api-public response. Used by OTP verify, token
// refresh, and Google exchange — the admin SPA and standalone api-public clients
// rely on these (the public BFF instead manages its own cookies from the body).
export function setAuthCookies(res: Response, pair: TokenPair, secure: boolean): void {
  res.cookie(REFRESH_COOKIE, pair.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
  res.cookie(SID_COOKIE, pair.sid, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: SID_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  res.clearCookie(SID_COOKIE, { path: SID_COOKIE_PATH });
}
