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
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { PartnerResponseDto } from "./dto/partner-response.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { PartnersService } from "./partners.service";

@ApiBearerAuth()
@Controller("home/partners")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: PartnerResponseDto, excludeExtraneousValues: true })
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get()
  @ApiOkResponse({ type: PartnerResponseDto, isArray: true })
  listPartnerItems(@CurrentAdmin() admin: AdminContext): Promise<PartnerResponseDto[]> {
    return this.partners.listItems(admin.artist.id);
  }

  @Post()
  @ApiOkResponse({ type: PartnerResponseDto })
  createPartnerItem(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.partners.createItem(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: PartnerResponseDto })
  updatePartnerItem(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    return this.partners.updateItem(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deletePartnerItem(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.partners.deleteItem(admin.artist.id, admin.user.id, id);
  }
}
