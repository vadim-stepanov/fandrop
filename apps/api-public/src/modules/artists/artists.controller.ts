import { Controller, Get, Param, Query, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/auth/optional-jwt-auth.guard";
import { OptionalUser } from "../../common/auth/optional-user.decorator";
import { PointsService } from "../points/points.service";
import { AvatarResponseDto, BalanceResponseDto } from "./dto/balance.dto";
import { CanAdminResponseDto } from "./dto/can-admin.dto";
import { PointsSummaryResponseDto } from "./dto/points-summary.dto";
import { TransactionPageResponseDto } from "./dto/transaction.dto";
import { PublicArtistHomeResponseDto } from "./dto/public-artist-home.dto";
import { PublicLeaderboardResponseDto } from "./dto/public-leaderboard.dto";
import { PublicPartnerResponseDto } from "./dto/public-partner.dto";
import { PublicPromoResponseDto } from "./dto/public-promo.dto";
import { PublicRuleResponseDto } from "./dto/public-rule.dto";
import { PublicStoreItemResponseDto } from "./dto/public-store-item.dto";
import { ArtistsService } from "./artists.service";

// Top-N featured store items shown in the Store block on Home.
const STORE_FEATURED_SIZE = 4;

// Public — the artist Home page is viewable without auth (spec §2).
@Controller("artists")
export class ArtistsController {
  constructor(
    private readonly artists: ArtistsService,
    private readonly points: PointsService,
  ) {}

  @Get(":slug/home")
  @ApiOkResponse({ type: PublicArtistHomeResponseDto })
  @SerializeOptions({ type: PublicArtistHomeResponseDto, excludeExtraneousValues: true })
  getArtistHome(@Param("slug") slug: string): Promise<PublicArtistHomeResponseDto> {
    return this.artists.getPublicHome(slug);
  }

  @Get(":slug/rules")
  @ApiOkResponse({ type: PublicRuleResponseDto, isArray: true })
  @SerializeOptions({ type: PublicRuleResponseDto, excludeExtraneousValues: true })
  getArtistRules(@Param("slug") slug: string): Promise<PublicRuleResponseDto[]> {
    return this.artists.getRules(slug);
  }

  @Get(":slug/partners")
  @ApiOkResponse({ type: PublicPartnerResponseDto, isArray: true })
  @SerializeOptions({ type: PublicPartnerResponseDto, excludeExtraneousValues: true })
  getArtistPartners(@Param("slug") slug: string): Promise<PublicPartnerResponseDto[]> {
    return this.artists.getPartners(slug);
  }

  // Public — top members by points balance (spec §4) + collapse/expand config.
  // Optional auth: a valid Bearer adds the viewer's own row (myEntry).
  @Get(":slug/leaderboard")
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: PublicLeaderboardResponseDto })
  @SerializeOptions({ type: PublicLeaderboardResponseDto, excludeExtraneousValues: true })
  getLeaderboard(
    @OptionalUser() viewerId: string | null,
    @Param("slug") slug: string,
  ): Promise<PublicLeaderboardResponseDto> {
    return this.points.getLeaderboardView(slug, viewerId);
  }

  // Null body when there's no active/visible promo — the page renders nothing.
  @Get(":slug/promo")
  @ApiOkResponse({ type: PublicPromoResponseDto })
  @SerializeOptions({ type: PublicPromoResponseDto, excludeExtraneousValues: true })
  getActivePromo(@Param("slug") slug: string): Promise<PublicPromoResponseDto | null> {
    return this.artists.getActivePromo(slug);
  }

  // Full Store page — member-only (Store can hold sensitive items; anons/
  // crawlers must not see the full catalogue). The Home teaser uses the public
  // /store/featured below.
  @Get(":slug/store")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PublicStoreItemResponseDto, isArray: true })
  @SerializeOptions({ type: PublicStoreItemResponseDto, excludeExtraneousValues: true })
  getStore(@Param("slug") slug: string): Promise<PublicStoreItemResponseDto[]> {
    return this.artists.getStore(slug);
  }

  // Top-N featured items for the Store block on Home.
  @Get(":slug/store/featured")
  @ApiOkResponse({ type: PublicStoreItemResponseDto, isArray: true })
  @SerializeOptions({ type: PublicStoreItemResponseDto, excludeExtraneousValues: true })
  getStoreFeatured(@Param("slug") slug: string): Promise<PublicStoreItemResponseDto[]> {
    return this.artists.getStoreFeatured(slug, STORE_FEATURED_SIZE);
  }

  // The signed-in viewer's points balance at this artist (0 if no membership).
  @Get(":slug/me/balance")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: BalanceResponseDto })
  @SerializeOptions({ type: BalanceResponseDto, excludeExtraneousValues: true })
  async getMyBalance(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<BalanceResponseDto> {
    return { balance: await this.points.getBalanceForUserAndArtist(userId, slug) };
  }

  // The signed-in viewer's avatar (uploaded, else Google) — drives the navbar
  // widget + Profile.
  @Get(":slug/me/avatar")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: AvatarResponseDto })
  @SerializeOptions({ type: AvatarResponseDto, excludeExtraneousValues: true })
  async getMyAvatar(@CurrentUser() userId: string): Promise<AvatarResponseDto> {
    return { avatarUrl: await this.artists.getMyAvatar(userId) };
  }

  // Whether the signed-in viewer can open the admin panel for this artist.
  @Get(":slug/me/can-admin")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: CanAdminResponseDto })
  @SerializeOptions({ type: CanAdminResponseDto, excludeExtraneousValues: true })
  async getCanAdmin(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<CanAdminResponseDto> {
    return { canOpenAdmin: await this.artists.canManageArtist(userId, slug) };
  }

  // Profile header summary — current balance + lifetime earned.
  @Get(":slug/me/points-summary")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PointsSummaryResponseDto })
  @SerializeOptions({ type: PointsSummaryResponseDto, excludeExtraneousValues: true })
  getMyPointsSummary(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<PointsSummaryResponseDto> {
    return this.points.getPointsSummary(userId, slug);
  }

  // Paginated points-ledger history for the Profile page.
  @Get(":slug/me/transactions")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: TransactionPageResponseDto })
  @SerializeOptions({ type: TransactionPageResponseDto, excludeExtraneousValues: true })
  getMyTransactions(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Query("page") page?: string,
  ): Promise<TransactionPageResponseDto> {
    return this.points.getTransactions(userId, slug, Number(page) || 1);
  }
}
