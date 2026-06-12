import { Controller, Get, Param, Post, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { InventoryItemResponseDto } from "./dto/inventory-item.dto";
import { PurchasePreviewResponseDto } from "./dto/purchase-preview.dto";
import { PurchaseResultResponseDto } from "./dto/purchase-result.dto";
import { PurchaseService } from "./purchase.service";

// All member-only (purchases + inventory require auth at this artist).
@Controller("artists")
export class PurchaseController {
  constructor(private readonly purchase: PurchaseService) {}

  @Post(":slug/store/:itemId/purchase")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PurchaseResultResponseDto })
  @SerializeOptions({ type: PurchaseResultResponseDto, excludeExtraneousValues: true })
  buy(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("itemId") itemId: string,
  ): Promise<PurchaseResultResponseDto> {
    return this.purchase.purchase(userId, slug, itemId);
  }

  // Predicted balance/rank after buying — for the confirm modal.
  @Get(":slug/store/:itemId/purchase-preview")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PurchasePreviewResponseDto })
  @SerializeOptions({ type: PurchasePreviewResponseDto, excludeExtraneousValues: true })
  preview(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("itemId") itemId: string,
  ): Promise<PurchasePreviewResponseDto> {
    return this.purchase.preview(userId, slug, itemId);
  }

  @Get(":slug/me/inventory")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: InventoryItemResponseDto, isArray: true })
  @SerializeOptions({ type: InventoryItemResponseDto, excludeExtraneousValues: true })
  inventory(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<InventoryItemResponseDto[]> {
    return this.purchase.getInventory(userId, slug);
  }
}
