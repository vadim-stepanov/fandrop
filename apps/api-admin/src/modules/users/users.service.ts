import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED, MEMBER_NOTICE, USER_WIPED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { ArtistHomeSectionKey } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AdjustPointsDto } from "./dto/adjust-points.dto";
import { AdminUserResponseDto } from "./dto/admin-user.dto";
import { InventoryItemResponseDto } from "./dto/inventory-item.dto";
import { MemberQuestResponseDto } from "./dto/member-quest.dto";
import { TransactionPageResponseDto } from "./dto/transaction.dto";

const TX_PAGE_SIZE = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  async list(artistId: string): Promise<AdminUserResponseDto[]> {
    const members = await this.prisma.artistUser.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { email: true, avatarUrl: true, googleAvatarUrl: true } },
        referredBy: { select: { user: { select: { email: true } } } },
        _count: { select: { inventoryItems: true } },
      },
    });

    // Balances are ledger-derived (no denormalized column) — two batched groupBys.
    const [totals, earned] = await Promise.all([
      this.prisma.artistPointsTransaction.groupBy({
        by: ["artistUserId"],
        where: { artistUser: { artistId } },
        _sum: { amount: true },
      }),
      this.prisma.artistPointsTransaction.groupBy({
        by: ["artistUserId"],
        where: { artistUser: { artistId }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    const balanceById = new Map(totals.map((t) => [t.artistUserId, t._sum.amount ?? 0]));
    const earnedById = new Map(earned.map((e) => [e.artistUserId, e._sum.amount ?? 0]));

    return members.map((m) => ({
      id: m.id,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl ?? m.user.googleAvatarUrl,
      role: m.role,
      balance: balanceById.get(m.id) ?? 0,
      totalEarned: earnedById.get(m.id) ?? 0,
      inventoryCount: m._count.inventoryItems,
      referredByEmail: m.referredBy?.user.email ?? null,
      createdAt: m.createdAt,
    }));
  }

  // Hard delete — cascade removes the member's ledger/inventory/socials/purchases;
  // referredBy on anyone they invited becomes null. Admins can't be deleted here.
  async remove(artistId: string, adminUserId: string, id: string): Promise<void> {
    const row = await this.prisma.artistUser.findFirst({
      where: { id, artistId },
      select: { id: true, role: true, userId: true, user: { select: { email: true } } },
    });
    if (!row) {
      throw new NotFoundException("Member not found");
    }
    if (row.role === "ARTIST_ADMIN") {
      throw new BadRequestException("Can't delete an admin");
    }
    await this.prisma.artistUser.delete({ where: { id } });
    // Leaderboard + member lists changed → live-refresh public viewers.
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    // Force-log-out the deleted user's live public sessions.
    await this.bus.publish(USER_WIPED, { userId: row.userId, artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "WIPE_USER",
      entityType: "ARTIST_USER",
      entityId: id,
      beforePayload: { email: row.user.email, role: row.role },
    });
  }

  // Manual points correction → ADMIN_ADJUSTMENT ledger entry (balance = ledger sum).
  async adjustPoints(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: AdjustPointsDto,
  ): Promise<void> {
    const member = await this.ownedMember(artistId, id);
    const description = dto.description?.trim();
    const reason = description && description.length > 0 ? description : "Admin adjustment";
    await this.prisma.artistPointsTransaction.create({
      data: {
        artistUserId: id,
        amount: dto.amount,
        kind: "ADMIN_ADJUSTMENT",
        description: reason,
      },
    });
    // Live-refresh public viewers so the member's balance widget animates the
    // change, and toast the member so the "self-changing" balance is explained.
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.bus.publish(MEMBER_NOTICE, {
      userId: member.userId,
      artistId,
      notice: { kind: "points-adjusted", amount: dto.amount },
    });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "ADJUST_POINTS",
      entityType: "ARTIST_USER",
      entityId: id,
      afterPayload: { amount: dto.amount },
      reason,
    });
  }

  // ── Member quest management (Users → Manage quests modal) ────────────────

  // All quests of the artist + this member's status.
  async listMemberQuests(artistId: string, id: string): Promise<MemberQuestResponseDto[]> {
    await this.ownedMember(artistId, id);
    const quests = await this.prisma.artistQuest.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.QUESTS } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        rewardPoints: true,
        userQuests: { where: { artistUserId: id }, select: { status: true } },
      },
    });
    return quests.map((quest) => ({
      questId: quest.id,
      title: quest.title,
      rewardPoints: quest.rewardPoints,
      status: quest.userQuests[0]?.status ?? "NOT_STARTED",
    }));
  }

  // Toggle the member's progress between NOT_STARTED and COMPLETED. Never touches
  // the ledger (points only move via claim) — un-completing a CLAIMED quest keeps
  // the already-credited points (ledger rule: balance corrections go via Adjust).
  async setMemberQuestStatus(
    artistId: string,
    adminUserId: string,
    id: string,
    questId: string,
    status: "NOT_STARTED" | "COMPLETED",
  ): Promise<void> {
    await this.ownedMember(artistId, id);
    await this.ownedQuest(artistId, questId);
    const before = await this.prisma.artistUserQuest.findUnique({
      where: { artistUserId_questId: { artistUserId: id, questId } },
      select: { status: true },
    });
    const now = new Date();
    await this.prisma.artistUserQuest.upsert({
      where: { artistUserId_questId: { artistUserId: id, questId } },
      create:
        status === "COMPLETED"
          ? { artistUserId: id, questId, status, startedAt: now, completedAt: now }
          : { artistUserId: id, questId, status },
      update: status === "COMPLETED" ? { status, completedAt: now } : { status, claimedAt: null },
    });
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_USER",
      entityId: id,
      beforePayload: { questId, status: before?.status ?? "NOT_STARTED" },
      afterPayload: { questId, status },
    });
  }

  // Claim a member's COMPLETED quest on their behalf → credit points once.
  async claimMemberQuest(
    artistId: string,
    adminUserId: string,
    id: string,
    questId: string,
  ): Promise<void> {
    const member = await this.ownedMember(artistId, id);
    const quest = await this.ownedQuest(artistId, questId);
    const result = await this.prisma.$transaction(async (tx): Promise<number | null> => {
      const userQuest = await tx.artistUserQuest.findUnique({
        where: { artistUserId_questId: { artistUserId: id, questId } },
        select: { id: true, status: true },
      });
      if (!userQuest || userQuest.status !== "COMPLETED") {
        return null;
      }
      const amount = Math.max(0, quest.rewardPoints);
      if (amount > 0) {
        await tx.artistPointsTransaction.create({
          data: {
            artistUserId: id,
            amount,
            kind: "QUEST_REWARD",
            description: `Quest reward: ${quest.title}`,
          },
        });
      }
      await tx.artistUserQuest.update({
        where: { id: userQuest.id },
        data: { status: "CLAIMED", claimedAt: new Date() },
      });
      return amount;
    });

    if (result === null) {
      throw new BadRequestException("Quest is not in a claimable state");
    }
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.bus.publish(MEMBER_NOTICE, {
      userId: member.userId,
      artistId,
      notice: { kind: "points-adjusted", amount: result },
    });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "ADJUST_POINTS",
      entityType: "ARTIST_USER",
      entityId: id,
      afterPayload: { questId, claimed: true, amount: result },
    });
  }

  private async ownedQuest(
    artistId: string,
    questId: string,
  ): Promise<{ rewardPoints: number; title: string }> {
    const quest = await this.prisma.artistQuest.findFirst({
      where: { id: questId, section: { artistId, key: ArtistHomeSectionKey.QUESTS } },
      select: { rewardPoints: true, title: true },
    });
    if (!quest) {
      throw new NotFoundException("Quest not found");
    }
    return quest;
  }

  // Paginated points history for one member (newest first), excluding rows the
  // admin hid. Balance is unaffected by hiding — this is a view filter only.
  async listTransactions(
    artistId: string,
    id: string,
    page: number,
  ): Promise<TransactionPageResponseDto> {
    await this.ownedMember(artistId, id);
    const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
    const where = { artistUserId: id, hiddenAt: null };
    const [entries, totalCount] = await Promise.all([
      this.prisma.artistPointsTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * TX_PAGE_SIZE,
        take: TX_PAGE_SIZE,
        select: { id: true, createdAt: true, amount: true, kind: true, description: true },
      }),
      this.prisma.artistPointsTransaction.count({ where }),
    ]);
    return {
      entries,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(totalCount / TX_PAGE_SIZE)),
      totalCount,
    };
  }

  // Soft-delete one ledger entry from history. NEVER touches the balance (the
  // row stays in the SUM) — balance corrections go through Adjust points.
  async hideTransaction(
    artistId: string,
    adminUserId: string,
    id: string,
    txId: string,
  ): Promise<void> {
    await this.ownedMember(artistId, id);
    const tx = await this.prisma.artistPointsTransaction.findFirst({
      where: { id: txId, artistUserId: id, hiddenAt: null },
      select: { id: true, amount: true, kind: true, description: true, createdAt: true },
    });
    if (!tx) {
      throw new NotFoundException("Transaction not found");
    }
    await this.prisma.artistPointsTransaction.update({
      where: { id: txId },
      data: { hiddenAt: new Date() },
    });
    // Hidden row drops from the member's profile history → refetch public viewers
    // (balance/leaderboard unchanged — this only affects the history list).
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_POINTS_TRANSACTION",
      entityId: txId,
      beforePayload: {
        amount: tx.amount,
        kind: tx.kind,
        description: tx.description,
        createdAt: tx.createdAt,
      },
      reason: "Hidden from history (balance unchanged)",
    });
  }

  // Soft-delete all of a member's visible ledger entries. Balance unchanged.
  async hideAllTransactions(artistId: string, adminUserId: string, id: string): Promise<void> {
    await this.ownedMember(artistId, id);
    const result = await this.prisma.artistPointsTransaction.updateMany({
      where: { artistUserId: id, hiddenAt: null },
      data: { hiddenAt: new Date() },
    });
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_POINTS_TRANSACTION",
      entityId: id,
      beforePayload: { rowsHidden: result.count, scope: "all-for-user" },
      reason: "Hidden all from history (balance unchanged)",
    });
  }

  // Grant a store item to a member without a purchase: a synthetic ArtistPurchase
  // (the inventory row's 1:1 link is required) + a snapshot inventory row. No
  // stock decrement, no points/ledger, no loyalty — the item just appears.
  async grantInventory(
    artistId: string,
    adminUserId: string,
    id: string,
    storeItemId: string,
  ): Promise<void> {
    const member = await this.ownedMember(artistId, id);
    const item = await this.prisma.artistStoreItem.findFirst({
      where: { id: storeItemId, section: { artistId, key: ArtistHomeSectionKey.STORE } },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
        quality: true,
        priceMode: true,
      },
    });
    if (!item) {
      throw new NotFoundException("Store item not found");
    }
    const inventoryId = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.artistPurchase.create({
        data: {
          artistUserId: id,
          storeItemId: item.id,
          priceMode: item.priceMode,
          loyaltyAwarded: 0,
        },
        select: { id: true },
      });
      const inv = await tx.artistInventoryItem.create({
        data: {
          artistUserId: id,
          purchaseId: purchase.id,
          storeItemId: item.id,
          title: item.title,
          imageUrl: item.imageUrl,
          category: item.category,
          quality: item.quality,
        },
        select: { id: true },
      });
      return inv.id;
    });
    // Inventory changed → public profile inventory block refetches; the admin's
    // own Users list refetches via the mutation's onSuccess (inventoryCount).
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.bus.publish(MEMBER_NOTICE, {
      userId: member.userId,
      artistId,
      notice: { kind: "inventory-granted", itemName: item.title },
    });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_INVENTORY_ITEM",
      entityId: inventoryId,
      afterPayload: { storeItemId: item.id, title: item.title, artistUserId: id },
      reason: "Granted inventory (no charge)",
    });
  }

  // A member's owned items (newest first) for the admin manage dialog.
  async listInventory(artistId: string, id: string): Promise<InventoryItemResponseDto[]> {
    await this.ownedMember(artistId, id);
    return this.prisma.artistInventoryItem.findMany({
      where: { artistUserId: id },
      orderBy: { acquiredAt: "desc" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
        quality: true,
        acquiredAt: true,
      },
    });
  }

  // Hard-delete an owned item. Unlike points (balance = ledger SUM, hence
  // soft-delete), inventory has no such invariant, so removal is a clean delete;
  // the audit row keeps the trail. No refund — the points ledger is untouched.
  async deleteInventory(
    artistId: string,
    adminUserId: string,
    id: string,
    itemId: string,
  ): Promise<void> {
    const member = await this.ownedMember(artistId, id);
    const item = await this.prisma.artistInventoryItem.findFirst({
      where: { id: itemId, artistUserId: id },
      select: { id: true, title: true, storeItemId: true, category: true, quality: true },
    });
    if (!item) {
      throw new NotFoundException("Inventory item not found");
    }
    await this.prisma.artistInventoryItem.delete({ where: { id: itemId } });
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.bus.publish(MEMBER_NOTICE, {
      userId: member.userId,
      artistId,
      notice: { kind: "inventory-removed", itemName: item.title },
    });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_INVENTORY_ITEM",
      entityId: itemId,
      beforePayload: {
        title: item.title,
        storeItemId: item.storeItemId,
        category: item.category,
        quality: item.quality,
      },
      reason: "Removed from inventory (no refund)",
    });
  }

  private async ownedMember(artistId: string, id: string): Promise<{ id: string; userId: string }> {
    const row = await this.prisma.artistUser.findFirst({
      where: { id, artistId },
      select: { id: true, userId: true },
    });
    if (!row) {
      throw new NotFoundException("Member not found");
    }
    return row;
  }
}
