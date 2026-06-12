import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import type { Env } from "../config/env.schema";
import type { AuthedRequest } from "./auth.types";

// Validates the access JWT issued by api-public (shared JWT_ACCESS_SECRET).
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
      });
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
