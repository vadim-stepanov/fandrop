import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ArtistSocialLinkResponseDto } from "./dto/artist-social-link.dto";
import { CreateSocialLinkDto } from "./dto/create-social-link.dto";
import { SocialPlatformResponseDto } from "./dto/social-platform.dto";
import { UpdateSocialLinkDto } from "./dto/update-social-link.dto";

export const ARTIST_SOCIAL_LINK_LIMIT = 6;

const socialPlatformSelect = {
  id: true,
  slug: true,
  label: true,
  icon: true,
} as const satisfies Prisma.SocialPlatformSelect;

const linkSelect = {
  id: true,
  connectBonus: true,
  sortOrder: true,
  isVisible: true,
  socialPlatform: { select: socialPlatformSelect },
} as const satisfies Prisma.ArtistSocialLinkSelect;

@Injectable()
export class SocialLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  list(artistId: string): Promise<ArtistSocialLinkResponseDto[]> {
    return this.prisma.artistSocialLink.findMany({
      where: { artistId },
      orderBy: [{ sortOrder: "asc" }, { socialPlatform: { label: "asc" } }],
      select: linkSelect,
    });
  }

  // Active platforms available to add (the "add platform" picker).
  catalog(): Promise<SocialPlatformResponseDto[]> {
    return this.prisma.socialPlatform.findMany({
      where: { isActive: true },
      orderBy: { label: "asc" },
      select: socialPlatformSelect,
    });
  }

  async createItem(
    artistId: string,
    adminUserId: string,
    dto: CreateSocialLinkDto,
  ): Promise<ArtistSocialLinkResponseDto> {
    const platform = await this.prisma.socialPlatform.findFirst({
      where: { id: dto.socialPlatformId, isActive: true },
      select: { id: true },
    });
    if (!platform) {
      throw new NotFoundException("Social platform not found");
    }
    const duplicate = await this.prisma.artistSocialLink.findFirst({
      where: { artistId, socialPlatformId: dto.socialPlatformId },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException("Platform already added");
    }
    const count = await this.prisma.artistSocialLink.count({ where: { artistId } });
    if (count >= ARTIST_SOCIAL_LINK_LIMIT) {
      throw new BadRequestException(
        `Limit of ${ARTIST_SOCIAL_LINK_LIMIT} social platforms reached`,
      );
    }

    const item = await this.prisma.artistSocialLink.create({
      data: {
        artistId,
        socialPlatformId: dto.socialPlatformId,
        connectBonus: dto.connectBonus,
        sortOrder: dto.sortOrder,
        isVisible: dto.isVisible,
      },
      select: linkSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_SOCIAL_LINK",
      entityId: item.id,
      afterPayload: item,
    });
    return item;
  }

  async updateItem(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdateSocialLinkDto,
  ): Promise<ArtistSocialLinkResponseDto> {
    const before = await this.ownedItem(artistId, id);
    const item = await this.prisma.artistSocialLink.update({
      where: { id },
      data: { ...dto },
      select: linkSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_SOCIAL_LINK",
      entityId: id,
      beforePayload: before,
      afterPayload: item,
    });
    return item;
  }

  async deleteItem(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedItem(artistId, id);
    await this.prisma.artistSocialLink.delete({ where: { id } });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_SOCIAL_LINK",
      entityId: id,
      beforePayload: before,
    });
  }

  private async ownedItem(artistId: string, id: string): Promise<ArtistSocialLinkResponseDto> {
    const owned = await this.prisma.artistSocialLink.findFirst({
      where: { id, artistId },
      select: linkSelect,
    });
    if (!owned) {
      throw new NotFoundException("Social link not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
