import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type { Env } from "../config/env.schema";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "./auth.constants";

export interface TokenPayload {
  sub: string;
  sid: string;
  jti: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  signAccess(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  signRefresh(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
      expiresIn: REFRESH_TOKEN_TTL,
    });
  }

  verifyRefresh(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync<TokenPayload>(token, {
      secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
    });
  }
}
