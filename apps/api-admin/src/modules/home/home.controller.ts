import { Body, Controller, Get, Param, Patch, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { HomeSectionResponseDto } from "./dto/home-section.dto";
import { UpdateHomeSectionDto } from "./dto/update-home-section.dto";
import { HomeService } from "./home.service";

@ApiBearerAuth()
@Controller("home/sections")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: HomeSectionResponseDto, excludeExtraneousValues: true })
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  @ApiOkResponse({ type: HomeSectionResponseDto, isArray: true })
  listHomeSections(@CurrentAdmin() admin: AdminContext): Promise<HomeSectionResponseDto[]> {
    return this.home.listSections(admin.artist.id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: HomeSectionResponseDto })
  updateHomeSection(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdateHomeSectionDto,
  ): Promise<HomeSectionResponseDto> {
    return this.home.updateSection(admin.artist.id, admin.user.id, id, dto);
  }
}
