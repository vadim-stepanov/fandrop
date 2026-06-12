import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ProfileSocialEntryResponseDto } from "./dto/profile-social-entry.dto";
import { SocialHandleDto } from "./dto/social-handle.dto";
import { SocialsService } from "./socials.service";

// Member-only — a viewer's own socials at this artist.
@ApiBearerAuth()
@Controller("artists")
@UseGuards(JwtAuthGuard)
export class SocialsController {
  constructor(private readonly socials: SocialsService) {}

  @Get(":slug/me/socials")
  @ApiOkResponse({ type: ProfileSocialEntryResponseDto, isArray: true })
  @SerializeOptions({ type: ProfileSocialEntryResponseDto, excludeExtraneousValues: true })
  getMySocials(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<ProfileSocialEntryResponseDto[]> {
    return this.socials.getProfileSocials(userId, slug);
  }

  @Post(":slug/me/socials/:linkId/connect")
  async connectSocial(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("linkId") linkId: string,
    @Body() dto: SocialHandleDto,
  ): Promise<void> {
    await this.socials.connect(userId, slug, linkId, dto.externalHandleOrUrl);
  }

  @Patch(":slug/me/socials/:linkId")
  async editSocial(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("linkId") linkId: string,
    @Body() dto: SocialHandleDto,
  ): Promise<void> {
    await this.socials.editConnection(userId, slug, linkId, dto.externalHandleOrUrl);
  }
}
