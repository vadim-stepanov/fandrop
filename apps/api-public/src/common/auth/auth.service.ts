import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ARTIST_ACTIVITY } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { MailerService } from "../mailer/mailer.service";
import { PrismaService } from "../prisma/prisma.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { normalizeEmail } from "./email";
import type { AuthResult, TokenPair } from "./auth.types";
import { OtpService, type OtpVerifyResult } from "./otp.service";
import { SessionService } from "./session.service";
import { TokenService, type TokenPayload } from "./token.service";

// Benign replay window for a just-rotated refresh token (race across tabs /
// reloads / a lost Set-Cookie). Within it, the previous jti is re-issued
// instead of being treated as theft. Outside it, reuse-detection still fires.
const REFRESH_GRACE_MS = 15_000;

const short = (value: string): string => value.slice(0, 8);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly mailer: MailerService,
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  async requestOtp(dto: RequestOtpDto): Promise<void> {
    const email = normalizeEmail(dto.email);
    const code = await this.otp.generate(email);
    await this.mailer.sendOtp(email, code);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResult> {
    const email = normalizeEmail(dto.email);
    const result = await this.otp.verify(email, dto.code);
    if (result !== "ok") {
      throw new UnauthorizedException(this.otpErrorMessage(result));
    }

    // Passwordless: first verify provisions the user, later verifies find them.
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    await this.consumeAdminGrants(user.id, email);
    // Logging in within an artist's context lazily provisions membership.
    if (dto.artistSlug) {
      await this.ensureMembership(user.id, dto.artistSlug, dto.referralCode);
    }

    return this.mintSession(user);
  }

  // Google sign-in (find-or-create by verified email, same session + membership
  // path as OTP). The verified Google email is the identity key — linking the
  // sub to an existing OTP account is safe. Caller (GoogleAuthService) has
  // already exchanged the code and fetched the verified profile.
  async loginWithGoogle(
    profile: { email: string; emailVerified: boolean; sub: string; picture?: string },
    artistSlug?: string,
    referralCode?: string,
  ): Promise<AuthResult> {
    if (!profile.emailVerified) {
      throw new UnauthorizedException("Google account email is not verified");
    }
    const email = normalizeEmail(profile.email);
    // Refresh googleAvatarUrl on every Google login; an uploaded avatarUrl (if
    // any) still wins at read time.
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email, googleSub: profile.sub, googleAvatarUrl: profile.picture ?? null },
      update: {
        googleSub: profile.sub,
        ...(profile.picture ? { googleAvatarUrl: profile.picture } : {}),
      },
    });

    await this.consumeAdminGrants(user.id, email);
    if (artistSlug) {
      await this.ensureMembership(user.id, artistSlug, referralCode);
    }

    return this.mintSession(user);
  }

  // Mint a fresh session (sid + rotating jti family) and access/refresh pair.
  // Shared by OTP verify and Google sign-in.
  private async mintSession(user: { id: string; email: string }): Promise<AuthResult> {
    const sid = randomUUID();
    const jti = randomUUID();
    const tokens = await this.issueTokens({ sub: user.id, sid, jti });
    await this.sessions.create(user.id, sid, jti);
    return { ...tokens, user: { id: user.id, email: user.email } };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: TokenPayload;
    try {
      payload = await this.tokens.verifyRefresh(refreshToken);
    } catch {
      this.logger.warn("refresh: invalid-token");
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.sessions.findBySid(payload.sub, payload.sid);
    if (!session) {
      this.logger.warn(`refresh: session-not-found sub=${payload.sub} sid=${short(payload.sid)}`);
      throw new UnauthorizedException("Session not found");
    }

    // Happy path: the presented token is the current one → rotate.
    if (session.activeJti === payload.jti) {
      const jti = randomUUID();
      const tokens = await this.issueTokens({ sub: payload.sub, sid: payload.sid, jti });
      await this.sessions.rotate(payload.sub, payload.sid, jti);
      this.logger.debug(
        `refresh: rotate sub=${payload.sub} sid=${short(payload.sid)} ${short(payload.jti)}->${short(jti)}`,
      );
      return tokens;
    }

    // Benign replay of the just-rotated token (race / multi-tab / lost cookie):
    // re-issue for the CURRENT active jti without rotating or revoking. This is
    // what stops `pnpm dev` restart logouts.
    if (
      session.prevJti === payload.jti &&
      session.rotatedAt !== undefined &&
      Date.now() - session.rotatedAt < REFRESH_GRACE_MS
    ) {
      this.logger.log(
        `refresh: grace-replay sub=${payload.sub} sid=${short(payload.sid)} jti=${short(payload.jti)}`,
      );
      return this.issueTokens({ sub: payload.sub, sid: payload.sid, jti: session.activeJti });
    }

    // Genuine reuse: an old token replayed outside the grace window → isolate
    // this device by dropping its session; other devices stay valid.
    await this.sessions.revokeSid(payload.sub, payload.sid);
    this.logger.warn(
      `refresh: reuse-nuke sub=${payload.sub} sid=${short(payload.sid)} jti=${short(payload.jti)} active=${short(session.activeJti)}`,
    );
    throw new UnauthorizedException("Refresh token reuse detected");
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokens.verifyRefresh(refreshToken);
      await this.sessions.revokeSid(payload.sub, payload.sid);
    } catch {
      // Token already invalid/expired — nothing to revoke; cookies still cleared.
      return;
    }
  }

  async logoutAll(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokens.verifyRefresh(refreshToken);
      await this.sessions.revokeAll(payload.sub);
    } catch {
      return;
    }
  }

  // On login, redeem any pending ARTIST_ADMIN grants for this email: make the
  // user an ARTIST_ADMIN of those artists and consume the grants (one-shot).
  private async consumeAdminGrants(userId: string, email: string): Promise<void> {
    const grants = await this.prisma.artistAdminGrant.findMany({ where: { email } });
    if (grants.length === 0) {
      return;
    }
    await this.prisma.$transaction(
      grants.flatMap((grant) => [
        this.prisma.artistUser.upsert({
          where: { artistId_userId: { artistId: grant.artistId, userId } },
          create: { artistId: grant.artistId, userId, role: "ARTIST_ADMIN" },
          update: { role: "ARTIST_ADMIN" },
        }),
        this.prisma.artistAdminGrant.delete({ where: { id: grant.id } }),
      ]),
    );
  }

  // Lazily create the per-artist membership (ArtistUser) for a fan logging in at
  // an artist. Existing members are left untouched (role never downgraded).
  // Referral is applied ONLY on first join: a valid code (program on + maps to
  // another member of this artist) links referredBy and credits both sides.
  private async ensureMembership(
    userId: string,
    artistSlug: string,
    referralCode?: string,
  ): Promise<void> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug: artistSlug },
      select: {
        id: true,
        referralEnabled: true,
        referralRewardPoints: true,
        signupBonusPoints: true,
      },
    });
    if (!artist) {
      return;
    }
    const existing = await this.prisma.artistUser.findUnique({
      where: { artistId_userId: { artistId: artist.id, userId } },
      select: { id: true },
    });
    if (existing) {
      return;
    }

    // Resolve the referrer (silently ignore invalid / disabled / unknown codes).
    // The new user has no membership yet, so self-referral is impossible.
    let referrer: { id: string } | null = null;
    if (referralCode && artist.referralEnabled) {
      referrer = await this.prisma.artistUser.findFirst({
        where: { referralCode, artistId: artist.id },
        select: { id: true },
      });
    }
    const reward = artist.referralRewardPoints;

    let outcome = { created: false, referral: false };
    try {
      outcome = await this.prisma.$transaction(async (tx) => {
        // Re-check inside the tx to close the find→create race.
        const recheck = await tx.artistUser.findUnique({
          where: { artistId_userId: { artistId: artist.id, userId } },
          select: { id: true },
        });
        if (recheck) {
          return { created: false, referral: false };
        }
        const created = await tx.artistUser.create({
          data: {
            artistId: artist.id,
            userId,
            role: "USER",
            referredByArtistUserId: referrer?.id ?? null,
            // Only members who join while a welcome bonus exists get the
            // onboarding modal. Joining with no bonus marks it seen, so later
            // raising the bonus doesn't pop the modal for existing members.
            hasSeenOnboarding: artist.signupBonusPoints === 0,
          },
          select: { id: true },
        });
        // Both sides earn the reward (matching), only with a valid referrer and
        // a positive amount.
        const referralCredited = Boolean(referrer) && reward > 0;
        if (referrer && reward > 0) {
          await tx.artistPointsTransaction.createMany({
            data: [
              {
                artistUserId: created.id,
                amount: reward,
                kind: "REFERRAL_REWARD",
                description: "Referral bonus (joined via invite)",
              },
              {
                artistUserId: referrer.id,
                amount: reward,
                kind: "REFERRAL_REWARD",
                description: "Referral bonus (invited a member)",
              },
            ],
          });
        }
        return { created: true, referral: referralCredited };
      });
    } catch (error) {
      // Lost the create race (parallel login) — the membership now exists; the
      // unique constraint kept it single. Treat as success.
      if ((error as { code?: string }).code !== "P2002") {
        throw error;
      }
    }

    // A genuinely new member (+ optional referral payout) changed the roster and
    // leaderboard → signal viewers + admin. Skipped on the no-op / race paths.
    if (outcome.created) {
      await this.bus.publish(ARTIST_ACTIVITY, {
        artistId: artist.id,
        userId,
        kind: outcome.referral ? "referral" : "membership",
      });
    }
  }

  private async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(payload),
      this.tokens.signRefresh(payload),
    ]);
    return { accessToken, refreshToken, sid: payload.sid };
  }

  private otpErrorMessage(result: Exclude<OtpVerifyResult, "ok">): string {
    switch (result) {
      case "invalid":
        return "Invalid code";
      case "expired":
        return "Code expired or not requested";
      case "too_many":
        return "Too many attempts, request a new code";
    }
  }
}
