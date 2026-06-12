import { Body, Controller, Get, Patch, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ReferralSettingsResponseDto } from "./dto/referral-settings.dto";
import { UpdateReferralSettingsDto } from "./dto/update-referral-settings.dto";
import { ReferralService } from "./referral.service";

// Per-artist referral config (toggle + reward points).
@ApiBearerAuth()
@Controller("referral-settings")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: ReferralSettingsResponseDto, excludeExtraneousValues: true })
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Get()
  @ApiOkResponse({ type: ReferralSettingsResponseDto })
  getReferralSettings(@CurrentAdmin() admin: AdminContext): Promise<ReferralSettingsResponseDto> {
    return this.referral.getSettings(admin.artist.id);
  }

  @Patch()
  @ApiOkResponse({ type: ReferralSettingsResponseDto })
  updateReferralSettings(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: UpdateReferralSettingsDto,
  ): Promise<ReferralSettingsResponseDto> {
    return this.referral.updateSettings(admin.artist.id, admin.user.id, dto);
  }
}
