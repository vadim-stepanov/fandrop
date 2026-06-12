import { Controller, Get, Param, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ReferralViewResponseDto } from "./dto/referral-view.dto";
import { ReferralService } from "./referral.service";

// Member-only — the viewer's own referral panel at this artist.
@ApiBearerAuth()
@Controller("artists")
@UseGuards(JwtAuthGuard)
@SerializeOptions({ type: ReferralViewResponseDto, excludeExtraneousValues: true })
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Get(":slug/me/referral")
  @ApiOkResponse({ type: ReferralViewResponseDto })
  getMyReferral(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<ReferralViewResponseDto> {
    return this.referral.getReferral(userId, slug);
  }
}
