import { Body, Controller, Get, Patch, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { LeaderboardConfigResponseDto } from "./dto/leaderboard-config.dto";
import { UpdateLeaderboardConfigDto } from "./dto/update-leaderboard-config.dto";
import { LeaderboardService } from "./leaderboard.service";

// Singleton config per artist — get-or-default on read, upsert on write.
@ApiBearerAuth()
@Controller("leaderboard-config")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: LeaderboardConfigResponseDto, excludeExtraneousValues: true })
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  @ApiOkResponse({ type: LeaderboardConfigResponseDto })
  getLeaderboardConfig(@CurrentAdmin() admin: AdminContext): Promise<LeaderboardConfigResponseDto> {
    return this.leaderboard.getConfig(admin.artist.id);
  }

  @Patch()
  @ApiOkResponse({ type: LeaderboardConfigResponseDto })
  updateLeaderboardConfig(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: UpdateLeaderboardConfigDto,
  ): Promise<LeaderboardConfigResponseDto> {
    return this.leaderboard.updateConfig(admin.artist.id, admin.user.id, dto);
  }
}
