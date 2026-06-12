import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { AdjustPointsDto } from "./dto/adjust-points.dto";
import { AdminUserResponseDto } from "./dto/admin-user.dto";
import { GrantInventoryDto } from "./dto/grant-inventory.dto";
import { InventoryItemResponseDto } from "./dto/inventory-item.dto";
import { MemberQuestResponseDto, SetMemberQuestStatusDto } from "./dto/member-quest.dto";
import { TransactionPageResponseDto } from "./dto/transaction.dto";
import { UsersService } from "./users.service";

// Per-artist member moderation (admin-scoped).
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOkResponse({ type: AdminUserResponseDto, isArray: true })
  @SerializeOptions({ type: AdminUserResponseDto, excludeExtraneousValues: true })
  listUsers(@CurrentAdmin() admin: AdminContext): Promise<AdminUserResponseDto[]> {
    return this.users.list(admin.artist.id);
  }

  @Delete(":id")
  async deleteUser(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    await this.users.remove(admin.artist.id, admin.user.id, id);
  }

  @Post(":id/adjust-points")
  async adjustUserPoints(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: AdjustPointsDto,
  ): Promise<void> {
    await this.users.adjustPoints(admin.artist.id, admin.user.id, id, dto);
  }

  @Get(":id/transactions")
  @ApiOkResponse({ type: TransactionPageResponseDto })
  @ApiQuery({ name: "page", required: false })
  @SerializeOptions({ type: TransactionPageResponseDto, excludeExtraneousValues: true })
  listUserTransactions(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Query("page") page?: string,
  ): Promise<TransactionPageResponseDto> {
    return this.users.listTransactions(admin.artist.id, id, Number(page) || 1);
  }

  @Delete(":id/transactions/:txId")
  async hideUserTransaction(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Param("txId") txId: string,
  ): Promise<void> {
    await this.users.hideTransaction(admin.artist.id, admin.user.id, id, txId);
  }

  @Delete(":id/transactions")
  async hideAllUserTransactions(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
  ): Promise<void> {
    await this.users.hideAllTransactions(admin.artist.id, admin.user.id, id);
  }

  @Post(":id/inventory")
  async grantUserInventory(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: GrantInventoryDto,
  ): Promise<void> {
    await this.users.grantInventory(admin.artist.id, admin.user.id, id, dto.storeItemId);
  }

  @Get(":id/inventory")
  @ApiOkResponse({ type: InventoryItemResponseDto, isArray: true })
  @SerializeOptions({ type: InventoryItemResponseDto, excludeExtraneousValues: true })
  listUserInventory(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
  ): Promise<InventoryItemResponseDto[]> {
    return this.users.listInventory(admin.artist.id, id);
  }

  @Delete(":id/inventory/:itemId")
  async deleteUserInventory(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ): Promise<void> {
    await this.users.deleteInventory(admin.artist.id, admin.user.id, id, itemId);
  }

  @Get(":id/quests")
  @ApiOkResponse({ type: MemberQuestResponseDto, isArray: true })
  @SerializeOptions({ type: MemberQuestResponseDto, excludeExtraneousValues: true })
  listMemberQuests(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
  ): Promise<MemberQuestResponseDto[]> {
    return this.users.listMemberQuests(admin.artist.id, id);
  }

  @Patch(":id/quests/:questId")
  async setMemberQuestStatus(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Param("questId") questId: string,
    @Body() dto: SetMemberQuestStatusDto,
  ): Promise<void> {
    await this.users.setMemberQuestStatus(admin.artist.id, admin.user.id, id, questId, dto.status);
  }

  @Post(":id/quests/:questId/claim")
  async claimMemberQuest(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Param("questId") questId: string,
  ): Promise<void> {
    await this.users.claimMemberQuest(admin.artist.id, admin.user.id, id, questId);
  }
}
