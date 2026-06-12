import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOkResponse } from "@nestjs/swagger";
import type { Response } from "express";

import type { Env } from "../config/env.schema";
import { setAuthCookies } from "./auth-cookies";
import { GoogleExchangeDto } from "./dto/google-exchange.dto";
import { GoogleAuthService } from "./google-auth.service";
import type { AuthenticatedUser } from "./auth.types";

// Google sign-in. `start` is hit by the browser (via the web-public /start
// proxy, or directly by the admin SPA with mode=admin) and 302s to Google.
// `exchange` is called from the callback (web-public BFF server-side, or the
// admin SPA browser-side) → tokens in the body + Set-Cookie for clients that
// rely on the api-public session cookies (the admin SPA does; the BFF doesn't).
@Controller("auth")
export class GoogleAuthController {
  constructor(
    private readonly google: GoogleAuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get("google/start")
  async start(
    @Res() res: Response,
    @Query("mode") mode?: string,
    @Query("artist") artist?: string,
    @Query("ref") ref?: string,
  ): Promise<void> {
    const url = await this.google.buildAuthUrl(mode === "admin" ? "admin" : "public", artist, ref);
    res.redirect(url);
  }

  @Post("google/exchange")
  @ApiOkResponse()
  async exchange(
    @Body() dto: GoogleExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sid: string;
    user: AuthenticatedUser;
    artistSlug?: string;
  }> {
    const result = await this.google.exchange(dto.code, dto.state);
    setAuthCookies(res, result, this.config.get("NODE_ENV", { infer: true }) === "production");
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sid: result.sid,
      user: result.user,
      artistSlug: result.artistSlug,
    };
  }
}
