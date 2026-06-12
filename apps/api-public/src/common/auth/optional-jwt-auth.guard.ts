import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type { Env } from "../config/env.schema";
import type { AuthedRequest } from "./auth.types";

// Like JwtAuthGuard but never rejects: attaches userId when a valid access token
// is present, leaves it undefined for anonymous viewers. For endpoints that are
// public but enrich the response when the viewer is signed in.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
          secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        });
        req.userId = payload.sub;
      } catch {
        // Invalid/expired token → treat as anonymous (no throw).
      }
    }
    return true;
  }
}
