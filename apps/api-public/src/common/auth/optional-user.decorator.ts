import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { AuthedRequest } from "./auth.types";

// Viewer's id when OptionalJwtAuthGuard validated a token, else null. Use on
// public routes guarded by OptionalJwtAuthGuard.
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    return req.userId ?? null;
  },
);
