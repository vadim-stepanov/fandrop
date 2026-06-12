import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ClaimResultResponseDto, OnboardingStateResponseDto } from "./dto/onboarding-state.dto";
import { OnboardingService } from "./onboarding.service";

// First-join onboarding: whether to show the welcome modal, claim the bonus,
// and mark the flow seen. Claim and complete are deliberately separate (the
// modal credits points on screen 0, flips the seen-flag on the final screen).
@ApiBearerAuth()
@Controller("artists")
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get(":slug/me/onboarding")
  @ApiOkResponse({ type: OnboardingStateResponseDto })
  @SerializeOptions({ type: OnboardingStateResponseDto, excludeExtraneousValues: true })
  getOnboardingState(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<OnboardingStateResponseDto> {
    return this.onboarding.getState(userId, slug);
  }

  @Post(":slug/me/onboarding/claim")
  @ApiOkResponse({ type: ClaimResultResponseDto })
  @SerializeOptions({ type: ClaimResultResponseDto, excludeExtraneousValues: true })
  claimWelcomeBonus(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<ClaimResultResponseDto> {
    return this.onboarding.claim(userId, slug);
  }

  @Post(":slug/me/onboarding/complete")
  @HttpCode(204)
  async completeOnboarding(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<void> {
    await this.onboarding.complete(userId, slug);
  }
}
