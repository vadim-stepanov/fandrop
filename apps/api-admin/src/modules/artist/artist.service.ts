import { Injectable } from "@nestjs/common";
import { type Artist, homeSectionDefaults } from "@fandrop/db";

import { PrismaService } from "../../common/prisma/prisma.service";

// Sole owner of the creation input — artists are created via CLI, so there is no
// HTTP DTO; the CLI command consumes this same type.
export type CreateArtistInput = {
  name: string;
  slug: string;
  adminEmail: string;
};

@Injectable()
export class ArtistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateArtistInput): Promise<Artist> {
    // Artist + admin grant atomically: the grant turns adminEmail into
    // ARTIST_ADMIN on that user's first OTP login (consumed by api-public).
    return this.prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: { name: input.name, slug: input.slug },
      });
      await tx.artistAdminGrant.create({
        data: { artistId: artist.id, email: input.adminEmail },
      });
      await tx.artistHomeSection.createMany({
        data: homeSectionDefaults.map((section) => ({ ...section, artistId: artist.id })),
      });
      return artist;
    });
  }
}
