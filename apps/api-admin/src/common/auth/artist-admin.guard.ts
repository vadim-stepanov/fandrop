import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthedRequest } from "./auth.types";

// Requires the authenticated user to be ARTIST_ADMIN of some artist, and
// attaches that admin context (user + artist) to the request. MVP: one
// artist per admin (first match).
@Injectable()
export class ArtistAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.userId) {
      throw new ForbiddenException("Not authenticated");
    }
    const artistUser = await this.prisma.artistUser.findFirst({
      where: { userId: req.userId, role: "ARTIST_ADMIN" },
      include: { artist: true, user: true },
    });
    if (!artistUser) {
      throw new ForbiddenException("Not an artist admin");
    }
    req.admin = {
      user: { id: artistUser.user.id, email: artistUser.user.email },
      artist: {
        id: artistUser.artist.id,
        slug: artistUser.artist.slug,
        name: artistUser.artist.name,
      },
    };
    return true;
  }
}
