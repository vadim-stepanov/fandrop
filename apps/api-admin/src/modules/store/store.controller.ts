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
import { CreateStoreItemDto } from "./dto/create-store-item.dto";
import { StoreItemResponseDto } from "./dto/store-item.dto";
import { UpdateStoreItemDto } from "./dto/update-store-item.dto";
import { StoreService } from "./store.service";

@ApiBearerAuth()
@Controller("store")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: StoreItemResponseDto, excludeExtraneousValues: true })
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  @ApiOkResponse({ type: StoreItemResponseDto, isArray: true })
  listStoreItems(@CurrentAdmin() admin: AdminContext): Promise<StoreItemResponseDto[]> {
    return this.store.listItems(admin.artist.id);
  }

  @Post()
  @ApiOkResponse({ type: StoreItemResponseDto })
  createStoreItem(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreateStoreItemDto,
  ): Promise<StoreItemResponseDto> {
    return this.store.createItem(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: StoreItemResponseDto })
  updateStoreItem(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdateStoreItemDto,
  ): Promise<StoreItemResponseDto> {
    return this.store.updateItem(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deleteStoreItem(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.store.deleteItem(admin.artist.id, admin.user.id, id);
  }
}
