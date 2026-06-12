import { Injectable } from "@nestjs/common";
import { Prisma } from "@fandrop/db";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LeaderboardConfigResponseDto } from "./dto/leaderboard-config.dto";
import { UpdateLeaderboardConfigDto } from "./dto/update-leaderboard-config.dto";

const configSelect = {
  topExpandedCount: true,
  visibleUserCount: true,
  expandedByDefault: true,
} as const satisfies Prisma.ArtistLeaderboardConfigSelect;

// Mirrors the schema defaults — returned when an artist has no config row yet.
const DEFAULT_CONFIG: LeaderboardConfigResponseDto = {
  topExpandedCount: 3,
  visibleUserCount: 10,
  expandedByDefault: false,
};

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  async getConfig(artistId: string): Promise<LeaderboardConfigResponseDto> {
    const config = await this.prisma.artistLeaderboardConfig.findUnique({
      where: { artistId },
      select: configSelect,
    });
    return config ?? DEFAULT_CONFIG;
  }

  async updateConfig(
    artistId: string,
    adminUserId: string,
    dto: UpdateLeaderboardConfigDto,
  ): Promise<LeaderboardConfigResponseDto> {
    const before = await this.prisma.artistLeaderboardConfig.findUnique({
      where: { artistId },
      select: configSelect,
    });
    const config = await this.prisma.artistLeaderboardConfig.upsert({
      where: { artistId },
      create: { artistId, ...dto },
      update: { ...dto },
      select: configSelect,
    });
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE_SETTINGS",
      entityType: "ARTIST_LEADERBOARD_CONFIG",
      entityId: artistId,
      beforePayload: before ?? undefined,
      afterPayload: config,
    });
    return config;
  }
}
