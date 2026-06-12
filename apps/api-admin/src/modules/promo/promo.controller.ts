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
import { CreatePromoDto } from "./dto/create-promo.dto";
import { PromoResponseDto } from "./dto/promo.dto";
import { UpdatePromoDto } from "./dto/update-promo.dto";
import { PromoService } from "./promo.service";

@ApiBearerAuth()
@Controller("home/promo")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: PromoResponseDto, excludeExtraneousValues: true })
export class PromoController {
  constructor(private readonly promo: PromoService) {}

  @Get()
  @ApiOkResponse({ type: PromoResponseDto, isArray: true })
  listPromoVariants(@CurrentAdmin() admin: AdminContext): Promise<PromoResponseDto[]> {
    return this.promo.listVariants(admin.artist.id);
  }

  @Post()
  @ApiOkResponse({ type: PromoResponseDto })
  createPromoVariant(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreatePromoDto,
  ): Promise<PromoResponseDto> {
    return this.promo.createVariant(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: PromoResponseDto })
  updatePromoVariant(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdatePromoDto,
  ): Promise<PromoResponseDto> {
    return this.promo.updateVariant(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deletePromoVariant(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.promo.deleteVariant(admin.artist.id, admin.user.id, id);
  }

  @Post(":id/active")
  @ApiOkResponse({ type: PromoResponseDto })
  setPromoActive(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
  ): Promise<PromoResponseDto> {
    return this.promo.setActive(admin.artist.id, admin.user.id, id);
  }
}
