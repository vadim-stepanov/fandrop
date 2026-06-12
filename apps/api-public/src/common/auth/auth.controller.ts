import { Body, Controller, Logger, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import type { Env } from "../config/env.schema";
import { REFRESH_COOKIE } from "./auth.constants";
import { clearAuthCookies, setAuthCookies } from "./auth-cookies";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import type { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // Dev convenience: print freshly minted access tokens to the console (same
  // spirit as the OTP-to-console log) so you can paste one into Swagger
  // "Authorize". One token works for BOTH /docs (shared JWT secret). Silent
  // in production.
  private logDevAccessToken(context: string, token: string): void {
    if (this.config.get("NODE_ENV", { infer: true }) !== "production") {
      this.logger.log(`[dev] access token (${context}) → paste in Swagger Authorize:\n${token}`);
    }
  }

  private get secureCookies(): boolean {
    return this.config.get("NODE_ENV", { infer: true }) === "production";
  }

  // Tighter than the global ceiling: OTP issuance sends email and is the
  // natural spam/abuse target.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("otp/request")
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    await this.auth.requestOtp(dto);
    return { message: "OTP sent" };
  }

  // Per-IP brute-force backstop on top of the per-code attempt counter in Redis.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("otp/verify")
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string; sid: string; user: AuthenticatedUser }> {
    const result = await this.auth.verifyOtp(dto);
    setAuthCookies(res, result, this.secureCookies);
    this.logDevAccessToken(`login ${result.user.email}`, result.accessToken);
    // Tokens also returned in the body so a BFF (Next proxy) can manage its
    // own cookies; the Set-Cookie above keeps api-public usable standalone.
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sid: result.sid,
      user: result.user,
    };
  }

  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string; sid: string }> {
    const token = this.readRefreshCookie(req);
    if (!token) {
      throw new UnauthorizedException("No refresh token");
    }
    try {
      const pair = await this.auth.refresh(token);
      setAuthCookies(res, pair, this.secureCookies);
      this.logDevAccessToken("refresh", pair.accessToken);
      return { accessToken: pair.accessToken, refreshToken: pair.refreshToken, sid: pair.sid };
    } catch (error) {
      // Only a genuine auth failure (invalid / reuse) clears the session
      // cookie. A transient error (e.g. Redis blip) must NOT — otherwise a
      // momentary glitch destroys a still-valid session.
      if (error instanceof UnauthorizedException) {
        clearAuthCookies(res);
      }
      throw error;
    }
  }

  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = this.readRefreshCookie(req);
    if (token) {
      await this.auth.logout(token);
    }
    clearAuthCookies(res);
    return { message: "Logged out" };
  }

  @Post("logout-all")
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = this.readRefreshCookie(req);
    if (token) {
      await this.auth.logoutAll(token);
    }
    clearAuthCookies(res);
    return { message: "Logged out everywhere" };
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string | undefined>;
    return cookies[REFRESH_COOKIE];
  }
}
