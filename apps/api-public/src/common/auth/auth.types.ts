import type { Request } from "express";

// Request augmented by JwtAuthGuard (sets the authenticated user's id).
export interface AuthedRequest extends Request {
  userId?: string;
}

// Auth-flow shapes shared by the auth/google services, the controllers and the
// cookie helper. Internal plumbing — there is no client-facing DTO mirroring
// these (the endpoints return inline shapes; refresh + sid travel as httpOnly
// cookies), so the service owns them directly.
export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sid: string;
}

export interface AuthResult extends TokenPair {
  user: AuthenticatedUser;
}
