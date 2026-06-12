import type { Request } from "express";

export interface AdminContext {
  user: { id: string; email: string };
  artist: { id: string; slug: string; name: string };
}

// Request augmented by the auth guards: JwtAuthGuard sets userId,
// ArtistAdminGuard sets admin (user + the artist they administer).
export interface AuthedRequest extends Request {
  userId?: string;
  admin?: AdminContext;
}
