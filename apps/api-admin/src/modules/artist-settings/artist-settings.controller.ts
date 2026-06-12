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
import { ArtistSettingsService } from "./artist-settings.service";
import { AddAdminDto, AddAdminResponseDto, AdminsListResponseDto } from "./dto/admins.dto";
import { ArtistSettingsResponseDto, UpdateArtistSettingsDto } from "./dto/artist-settings.dto";

// The admin's own artist: branding + admins management. Scoped to admin.artist.id.
@ApiBearerAuth()
@Controller("artist")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
export class ArtistSettingsController {
  constructor(private readonly settings: ArtistSettingsService) {}

  @Get()
  @ApiOkResponse({ type: ArtistSettingsResponseDto })
  @SerializeOptions({ type: ArtistSettingsResponseDto, excludeExtraneousValues: true })
  getArtistSettings(@CurrentAdmin() admin: AdminContext): Promise<ArtistSettingsResponseDto> {
    return this.settings.getSettings(admin.artist.id);
  }

  @Patch()
  async updateArtistSettings(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: UpdateArtistSettingsDto,
  ): Promise<void> {
    await this.settings.updateSettings(admin.artist.id, admin.user.id, dto);
  }

  @Get("admins")
  @ApiOkResponse({ type: AdminsListResponseDto })
  @SerializeOptions({ type: AdminsListResponseDto, excludeExtraneousValues: true })
  listArtistAdmins(@CurrentAdmin() admin: AdminContext): Promise<AdminsListResponseDto> {
    return this.settings.listAdmins(admin.artist.id);
  }

  @Post("admins")
  @ApiOkResponse({ type: AddAdminResponseDto })
  @SerializeOptions({ type: AddAdminResponseDto, excludeExtraneousValues: true })
  addArtistAdmin(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: AddAdminDto,
  ): Promise<AddAdminResponseDto> {
    return this.settings.addAdmin(admin.artist.id, admin.user.id, dto.email);
  }

  @Delete("admins/grants/:id")
  async cancelArtistAdminGrant(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
  ): Promise<void> {
    await this.settings.cancelGrant(admin.artist.id, admin.user.id, id);
  }
}
