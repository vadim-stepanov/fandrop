import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ARTIST_ACTIVITY } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { PrismaService } from "../../common/prisma/prisma.service";
import { ProfileSocialEntryResponseDto } from "./dto/profile-social-entry.dto";
import { isValidSocialHandleOrUrl } from "./social-helpers";

@Injectable()
export class SocialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  // Visible platforms the artist offers + the viewer's own connection per link.
  async getProfileSocials(userId: string, slug: string): Promise<ProfileSocialEntryResponseDto[]> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    const links = await this.prisma.artistSocialLink.findMany({
      where: { artist: { slug }, isVisible: true, socialPlatform: { isActive: true } },
      orderBy: [{ sortOrder: "asc" }, { socialPlatform: { label: "asc" } }],
      select: {
        id: true,
        connectBonus: true,
        socialPlatform: { select: { slug: true, label: true, icon: true } },
      },
    });
    if (links.length === 0) {
      return [];
    }

    const connByLink = new Map<
      string,
      { id: string; externalHandleOrUrl: string; connectedAt: Date }
    >();
    if (member) {
      const connections = await this.prisma.artistUserSocialConnection.findMany({
        where: { artistUserId: member.id, artistSocialLinkId: { in: links.map((l) => l.id) } },
        select: {
          id: true,
          artistSocialLinkId: true,
          externalHandleOrUrl: true,
          connectedAt: true,
        },
      });
      for (const c of connections) {
        connByLink.set(c.artistSocialLinkId, {
          id: c.id,
          externalHandleOrUrl: c.externalHandleOrUrl,
          connectedAt: c.connectedAt,
        });
      }
    }

    return links.map((link) => ({
      artistSocialLinkId: link.id,
      platformSlug: link.socialPlatform.slug,
      platformLabel: link.socialPlatform.label,
      platformIcon: link.socialPlatform.icon,
      connectBonus: link.connectBonus,
      connection: connByLink.get(link.id) ?? null,
    }));
  }

  // First connect awards the link's connectBonus once (SOCIAL_CONNECT). No
  // disconnect exists, so the bonus can't be farmed by re-connecting.
  async connect(userId: string, slug: string, linkId: string, rawHandle: string): Promise<void> {
    const handle = rawHandle.trim();
    if (!isValidSocialHandleOrUrl(handle)) {
      throw new BadRequestException("Enter a valid handle (@name) or URL");
    }
    const member = await this.memberOrThrow(userId, slug);
    const link = await this.prisma.artistSocialLink.findFirst({
      where: { id: linkId, isVisible: true, artist: { slug }, socialPlatform: { isActive: true } },
      select: {
        id: true,
        artistId: true,
        connectBonus: true,
        socialPlatform: { select: { label: true } },
      },
    });
    if (!link) {
      throw new NotFoundException("Social platform not available");
    }
    const existing = await this.prisma.artistUserSocialConnection.findUnique({
      where: {
        artistUserId_artistSocialLinkId: { artistUserId: member.id, artistSocialLinkId: link.id },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException("Already connected");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.artistUserSocialConnection.create({
        data: {
          artistUserId: member.id,
          artistSocialLinkId: link.id,
          externalHandleOrUrl: handle,
        },
      });
      if (link.connectBonus > 0) {
        await tx.artistPointsTransaction.create({
          data: {
            artistUserId: member.id,
            amount: link.connectBonus,
            kind: "SOCIAL_CONNECT",
            description: `Connected ${link.socialPlatform.label}`,
          },
        });
      }
    });

    // Points earned → leaderboard moved; signal viewers + admin to refetch.
    await this.bus.publish(ARTIST_ACTIVITY, {
      artistId: link.artistId,
      userId,
      kind: "social-connect",
    });
  }

  // Edit an existing connection's handle (no re-award).
  async editConnection(
    userId: string,
    slug: string,
    linkId: string,
    rawHandle: string,
  ): Promise<void> {
    const handle = rawHandle.trim();
    if (!isValidSocialHandleOrUrl(handle)) {
      throw new BadRequestException("Enter a valid handle (@name) or URL");
    }
    const member = await this.memberOrThrow(userId, slug);
    const connection = await this.prisma.artistUserSocialConnection.findFirst({
      where: {
        artistUserId: member.id,
        artistSocialLinkId: linkId,
        artistSocialLink: { artist: { slug } },
      },
      select: { id: true },
    });
    if (!connection) {
      throw new NotFoundException("Connection not found");
    }
    await this.prisma.artistUserSocialConnection.update({
      where: { id: connection.id },
      data: { externalHandleOrUrl: handle },
    });
  }

  private async memberOrThrow(userId: string, slug: string): Promise<{ id: string }> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    if (!member) {
      throw new ForbiddenException("Not a member of this artist");
    }
    return member;
  }
}
