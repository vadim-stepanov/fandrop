import { Injectable } from "@nestjs/common";
import { Prisma } from "@fandrop/db";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ReferralSettingsResponseDto } from "./dto/referral-settings.dto";
import { UpdateReferralSettingsDto } from "./dto/update-referral-settings.dto";

const settingsSelect = {
  referralEnabled: true,
  referralRewardPoints: true,
} as const satisfies Prisma.ArtistSelect;

// Referral config lives on the Artist row (toggle + per-referral reward).
@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bus: EventBus,
  ) {}

  getSettings(artistId: string): Promise<ReferralSettingsResponseDto> {
    return this.prisma.artist.findUniqueOrThrow({
      where: { id: artistId },
      select: settingsSelect,
    });
  }

  async updateSettings(
    artistId: string,
    adminUserId: string,
    dto: UpdateReferralSettingsDto,
  ): Promise<ReferralSettingsResponseDto> {
    const before = await this.prisma.artist.findUniqueOrThrow({
      where: { id: artistId },
      select: settingsSelect,
    });
    const settings = await this.prisma.artist.update({
      where: { id: artistId },
      data: { ...dto },
      select: settingsSelect,
    });
    // The Profile referral block shows/hides + reward badge changes for viewers
    // → signal public sessions to refetch (no hard refresh needed).
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE_SETTINGS",
      entityType: "ARTIST_REFERRAL_SETTINGS",
      entityId: artistId,
      beforePayload: before,
      afterPayload: settings,
    });
    return settings;
  }
}
