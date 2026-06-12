export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 300;
export const OTP_MAX_ATTEMPTS = 5;

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "30d";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Redis session keys carry this TTL, reset on every create/rotate (sliding
// window — matches the refresh-token lifetime; bounds orphaned-session growth).
export const REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_MS / 1000;

export const REFRESH_COOKIE = "refresh_token";
export const SID_COOKIE = "sid";

// Refresh cookie is scoped to the auth endpoints (refresh + logout flows)
// so it never travels on regular /api routes. Architecture §6 narrowed it to
// /auth/refresh, but logout also needs it, so /api/v1/auth covers both (URI
// versioning). Sid cookie travels only on the Socket.io handshake.
export const REFRESH_COOKIE_PATH = "/api/v1/auth";
export const SID_COOKIE_PATH = "/socket.io";
