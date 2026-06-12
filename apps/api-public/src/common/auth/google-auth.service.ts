import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";

import type { Env } from "../config/env.schema";
import { RedisService } from "../redis/redis.service";
import { AuthService } from "./auth.service";
import type { AuthResult } from "./auth.types";

const STATE_TTL_SECONDS = 600; // 10 min — covers the consent round-trip
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// "public" = fan login (web-public BFF callback); "admin" = the admin SPA
// callback. The chosen redirect_uri is stored in state so exchange reuses the
// exact value Google validated.
export type GoogleMode = "public" | "admin";

// state → context to resume after Google redirects back. The PKCE verifier lives
// here (server-side, keyed by state) — no client cookie needed.
type StatePayload = {
  artistSlug?: string;
  ref?: string;
  verifier: string;
  redirectUri: string;
};

const b64url = (buf: Buffer): string => buf.toString("base64url");

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly redis: RedisService,
    private readonly auth: AuthService,
  ) {}

  private clientCreds(): { clientId: string; clientSecret: string } {
    const clientId = this.config.get("GOOGLE_CLIENT_ID", { infer: true });
    const clientSecret = this.config.get("GOOGLE_CLIENT_SECRET", { infer: true });
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException("Google sign-in is not configured");
    }
    return { clientId, clientSecret };
  }

  private redirectUriFor(mode: GoogleMode): string {
    const uri =
      mode === "admin"
        ? this.config.get("GOOGLE_ADMIN_REDIRECT_URI", { infer: true })
        : this.config.get("GOOGLE_REDIRECT_URI", { infer: true });
    if (!uri) {
      throw new ServiceUnavailableException("Google sign-in is not configured for this app");
    }
    return uri;
  }

  // Build the Google consent URL + stash state/PKCE/context in Redis.
  async buildAuthUrl(mode: GoogleMode, artistSlug?: string, ref?: string): Promise<string> {
    const { clientId } = this.clientCreds();
    const redirectUri = this.redirectUriFor(mode);
    const state = b64url(randomBytes(24));
    const verifier = b64url(randomBytes(32));
    const challenge = b64url(createHash("sha256").update(verifier).digest());

    const payload: StatePayload = { artistSlug, ref, verifier, redirectUri };
    await this.redis.set(`google:state:${state}`, JSON.stringify(payload), "EX", STATE_TTL_SECONDS);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "online",
      prompt: "select_account",
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  // Verify state, exchange the code, fetch the verified profile, mint our session
  // (find-or-create user + membership + referral) — same path as OTP.
  async exchange(code: string, state: string): Promise<AuthResult & { artistSlug?: string }> {
    const { clientId, clientSecret } = this.clientCreds();

    const key = `google:state:${state}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new BadRequestException("Invalid or expired sign-in state");
    }
    await this.redis.del(key); // single-use (CSRF + replay protection)
    const { artistSlug, ref, verifier, redirectUri } = JSON.parse(raw) as StatePayload;

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException("Google token exchange failed");
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException("Google returned no access token");
    }

    const infoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!infoRes.ok) {
      throw new UnauthorizedException("Could not fetch Google profile");
    }
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };
    if (!info.sub || !info.email) {
      throw new UnauthorizedException("Incomplete Google profile");
    }

    const result = await this.auth.loginWithGoogle(
      {
        email: info.email,
        emailVerified: info.email_verified === true,
        sub: info.sub,
        picture: info.picture,
      },
      artistSlug,
      ref,
    );
    return { ...result, artistSlug };
  }
}
