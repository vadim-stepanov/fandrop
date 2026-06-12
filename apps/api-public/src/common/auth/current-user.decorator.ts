import { type ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";

import type { AuthedRequest } from "./auth.types";

// Returns the authenticated user's id (set by JwtAuthGuard). Use only on routes
// guarded by JwtAuthGuard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.userId) {
      throw new UnauthorizedException();
    }
    return req.userId;
  },
);
