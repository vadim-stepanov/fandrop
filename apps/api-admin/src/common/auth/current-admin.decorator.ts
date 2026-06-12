import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { AdminContext, AuthedRequest } from "./auth.types";

// Returns the admin context attached by ArtistAdminGuard. Only valid on
// routes guarded by JwtAuthGuard + ArtistAdminGuard.
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminContext => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    return req.admin as AdminContext;
  },
);
