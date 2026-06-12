import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@fandrop/db";
import { ARTIST_ACTIVITY } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { MailerService } from "../../common/mailer/mailer.service";
import { PointsService } from "../points/points.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InventoryItemResponseDto } from "./dto/inventory-item.dto";
import { PurchasePreviewResponseDto } from "./dto/purchase-preview.dto";
import { PurchaseResultResponseDto } from "./dto/purchase-result.dto";

const inventoryItemSelect = {
  id: true,
  storeItemId: true,
  title: true,
  imageUrl: true,
  category: true,
  quality: true,
  acquiredAt: true,
} as const satisfies Prisma.ArtistInventoryItemSelect;

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly mailer: MailerService,
    private readonly bus: EventBus,
  ) {}

  // Store is member-only, so a buyer always has a membership. Resolve it (+ email
  // for the confirmation mail) or 403.
  private async memberOrThrow(userId: string, slug: string) {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true, artistId: true, user: { select: { email: true } } },
    });
    if (!member) {
      throw new ForbiddenException("Not a member of this artist");
    }
    return member;
  }

  private async loadBuyableItem(slug: string, itemId: string) {
    const item = await this.prisma.artistStoreItem.findFirst({
      where: { id: itemId, isVisible: true, section: { artist: { slug } } },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
        quality: true,
        priceMode: true,
        priceAmountCents: true,
        currencyCode: true,
        pointsPrice: true,
        loyaltyPoints: true,
        stockCount: true,
        salesStartAt: true,
      },
    });
    if (!item) {
      throw new NotFoundException("Item not found");
    }
    if (item.salesStartAt && item.salesStartAt.getTime() > Date.now()) {
      throw new BadRequestException("Item is not on sale yet");
    }
    if (item.stockCount !== null && item.stockCount <= 0) {
      throw new BadRequestException("Item is sold out");
    }
    return item;
  }

  async purchase(userId: string, slug: string, itemId: string): Promise<PurchaseResultResponseDto> {
    const item = await this.loadBuyableItem(slug, itemId);
    const member = await this.memberOrThrow(userId, slug);

    const pointsCost = item.priceMode === "POINTS" ? (item.pointsPrice ?? 0) : 0;
    if (item.priceMode === "POINTS") {
      if (item.pointsPrice == null) {
        throw new BadRequestException("Item has no points price");
      }
      const balance = await this.points.getBalance(member.id);
      if (balance < pointsCost) {
        throw new BadRequestException("Not enough points");
      }
    }

    const inventoryItemId = await this.prisma.$transaction(async (tx) => {
      // Anti-oversell: only decrement when still in stock; 0 rows ⇒ lost the race.
      if (item.stockCount !== null) {
        const dec = await tx.artistStoreItem.updateMany({
          where: { id: item.id, stockCount: { gt: 0 } },
          data: { stockCount: { decrement: 1 } },
        });
        if (dec.count === 0) {
          throw new BadRequestException("Item is sold out");
        }
      }

      const purchase = await tx.artistPurchase.create({
        data: {
          artistUserId: member.id,
          storeItemId: item.id,
          priceMode: item.priceMode,
          pointsSpent: item.priceMode === "POINTS" ? pointsCost : null,
          amountCents: item.priceMode === "MONEY" ? item.priceAmountCents : null,
          currencyCode: item.priceMode === "MONEY" ? item.currencyCode : null,
          loyaltyAwarded: item.loyaltyPoints,
        },
        select: { id: true },
      });

      if (item.priceMode === "POINTS" && pointsCost > 0) {
        await tx.artistPointsTransaction.create({
          data: {
            artistUserId: member.id,
            amount: -pointsCost,
            kind: "POINTS_SPEND",
            description: `Purchase: ${item.title}`,
          },
        });
      }
      if (item.loyaltyPoints > 0) {
        await tx.artistPointsTransaction.create({
          data: {
            artistUserId: member.id,
            amount: item.loyaltyPoints,
            kind: "PURCHASE_REWARD",
            description: `Reward: ${item.title}`,
          },
        });
      }

      const inventory = await tx.artistInventoryItem.create({
        data: {
          artistUserId: member.id,
          purchaseId: purchase.id,
          storeItemId: item.id,
          title: item.title,
          imageUrl: item.imageUrl,
          category: item.category,
          quality: item.quality,
        },
        select: { id: true },
      });
      return inventory.id;
    });

    // Leaderboard/stock changed → tell viewers to refetch; admin views react too.
    await this.bus.publish(ARTIST_ACTIVITY, {
      artistId: member.artistId,
      userId,
      kind: "purchase",
    });

    const entry = await this.points.getMyLeaderboardEntry(userId, slug);
    // Fire-and-forget: a mail failure must not fail the (committed) purchase.
    void this.mailer.sendPurchaseConfirmation(member.user.email, item.title).catch(() => undefined);

    return {
      newBalance: entry?.points ?? 0,
      newRank: entry?.rank ?? 1,
      inventoryItemId,
    };
  }

  async preview(userId: string, slug: string, itemId: string): Promise<PurchasePreviewResponseDto> {
    const item = await this.loadBuyableItem(slug, itemId);
    const member = await this.memberOrThrow(userId, slug);

    const sums = await this.points.getMemberBalanceSums(slug);
    const currentBalance = sums.find((s) => s.artistUserId === member.id)?.balance ?? 0;
    // Other members' balances — rank = how many sit strictly above a given balance.
    const others = sums.filter((s) => s.artistUserId !== member.id).map((s) => s.balance);

    const pointsCost = item.priceMode === "POINTS" ? (item.pointsPrice ?? 0) : 0;
    const projectedBalance = currentBalance - pointsCost + item.loyaltyPoints;

    const currentRank = others.filter((b) => b > currentBalance).length + 1;
    const predictedRank = others.filter((b) => b > projectedBalance).length + 1;

    const above = others.filter((b) => b > projectedBalance);
    const nextRankTarget =
      above.length > 0
        ? { rank: predictedRank - 1, pointsNeeded: Math.min(...above) - projectedBalance + 1 }
        : null;

    return {
      currentBalance,
      currentRank,
      projectedBalance,
      predictedRank,
      pointsCost,
      loyaltyAward: item.loyaltyPoints,
      affordable: item.priceMode !== "POINTS" || currentBalance >= pointsCost,
      nextRankTarget,
    };
  }

  async getInventory(userId: string, slug: string): Promise<InventoryItemResponseDto[]> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    if (!member) {
      return [];
    }
    return this.prisma.artistInventoryItem.findMany({
      where: { artistUserId: member.id },
      orderBy: { acquiredAt: "desc" },
      select: inventoryItemSelect,
    });
  }
}
