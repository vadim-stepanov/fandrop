import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ArtistSocialLinkResponseDto } from "./dto/artist-social-link.dto";
import { CreateSocialLinkDto } from "./dto/create-social-link.dto";
import { SocialPlatformResponseDto } from "./dto/social-platform.dto";
import { UpdateSocialLinkDto } from "./dto/update-social-link.dto";
import { SocialLinksService } from "./social-links.service";

@ApiBearerAuth()
@Controller("social-links")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
export class SocialLinksController {
  constructor(private readonly socialLinks: SocialLinksService) {}

  @Get()
  @ApiOkResponse({ type: ArtistSocialLinkResponseDto, isArray: true })
  @SerializeOptions({ type: ArtistSocialLinkResponseDto, excludeExtraneousValues: true })
  listSocialLinks(@CurrentAdmin() admin: AdminContext): Promise<ArtistSocialLinkResponseDto[]> {
    return this.socialLinks.list(admin.artist.id);
  }

  // Active platform catalog for the "add platform" picker.
  @Get("catalog")
  @ApiOkResponse({ type: SocialPlatformResponseDto, isArray: true })
  @SerializeOptions({ type: SocialPlatformResponseDto, excludeExtraneousValues: true })
  listSocialPlatformCatalog(): Promise<SocialPlatformResponseDto[]> {
    return this.socialLinks.catalog();
  }

  @Post()
  @ApiOkResponse({ type: ArtistSocialLinkResponseDto })
  @SerializeOptions({ type: ArtistSocialLinkResponseDto, excludeExtraneousValues: true })
  createSocialLink(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreateSocialLinkDto,
  ): Promise<ArtistSocialLinkResponseDto> {
    return this.socialLinks.createItem(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: ArtistSocialLinkResponseDto })
  @SerializeOptions({ type: ArtistSocialLinkResponseDto, excludeExtraneousValues: true })
  updateSocialLink(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdateSocialLinkDto,
  ): Promise<ArtistSocialLinkResponseDto> {
    return this.socialLinks.updateItem(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deleteSocialLink(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.socialLinks.deleteItem(admin.artist.id, admin.user.id, id);
  }
}
