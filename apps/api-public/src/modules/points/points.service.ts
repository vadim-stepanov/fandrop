import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma/prisma.service";
import { LeaderboardEntryDto, LeaderboardSocialDto } from "../artists/dto/leaderboard-entry.dto";
import { PointsSummaryResponseDto } from "../artists/dto/points-summary.dto";
import { PublicLeaderboardResponseDto } from "../artists/dto/public-leaderboard.dto";
import { TransactionPageResponseDto } from "../artists/dto/transaction.dto";

export const TRANSACTION_HISTORY_PAGE_SIZE = 10;

// Returned when an artist has no leaderboard config row (mirrors schema defaults).
const DEFAULT_LEADERBOARD_CONFIG = {
  topExpandedCount: 3,
  visibleUserCount: 10,
  expandedByDefault: false,
};

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  // Member's balance = sum of all ledger transactions (0 if none).
  async getBalance(artistUserId: string): Promise<number> {
    const agg = await this.prisma.artistPointsTransaction.aggregate({
      where: { artistUserId },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? 0;
  }

  // Balance of a user at an artist (by slug). 0 when there's no membership.
  async getBalanceForUserAndArtist(userId: string, slug: string): Promise<number> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    return member ? this.getBalance(member.id) : 0;
  }

  // Profile header summary: current balance + lifetime earned (sum of positive
  // ledger entries). Zeroes when there's no membership.
  async getPointsSummary(userId: string, slug: string): Promise<PointsSummaryResponseDto> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    if (!member) {
      return { balance: 0, totalEarned: 0 };
    }
    const [balanceAgg, earnedAgg] = await Promise.all([
      this.prisma.artistPointsTransaction.aggregate({
        where: { artistUserId: member.id },
        _sum: { amount: true },
      }),
      this.prisma.artistPointsTransaction.aggregate({
        where: { artistUserId: member.id, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    return {
      balance: balanceAgg._sum.amount ?? 0,
      totalEarned: earnedAgg._sum.amount ?? 0,
    };
  }

  // Paginated points-ledger history for the viewer (newest first). Empty when no
  // membership; page is clamped into [1, totalPages].
  async getTransactions(
    userId: string,
    slug: string,
    page: number,
  ): Promise<TransactionPageResponseDto> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    if (!member) {
      return { entries: [], page: 1, totalPages: 1 };
    }
    // Exclude entries an admin hid from history (they stay in the balance SUM).
    const where = { artistUserId: member.id, hiddenAt: null };
    const totalCount = await this.prisma.artistPointsTransaction.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / TRANSACTION_HISTORY_PAGE_SIZE));
    const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
    const entries = await this.prisma.artistPointsTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * TRANSACTION_HISTORY_PAGE_SIZE,
      take: TRANSACTION_HISTORY_PAGE_SIZE,
      select: { id: true, amount: true, kind: true, description: true, createdAt: true },
    });
    return { entries, page: safePage, totalPages };
  }

  // Public leaderboard view: top-`visibleUserCount` entries + the collapse/expand
  // config (get-or-default) + the viewer's own row (when signed in). The FE shows
  // topExpandedCount rows, expanding to all. `viewerId` is null for anonymous.
  async getLeaderboardView(
    slug: string,
    viewerId: string | null,
  ): Promise<PublicLeaderboardResponseDto> {
    const config =
      (await this.prisma.artistLeaderboardConfig.findFirst({
        where: { artist: { slug } },
        select: { topExpandedCount: true, visibleUserCount: true, expandedByDefault: true },
      })) ?? DEFAULT_LEADERBOARD_CONFIG;
    const entries = await this.getLeaderboard(slug, config.visibleUserCount);
    const myEntry = viewerId ? await this.getMyLeaderboardEntry(viewerId, slug) : null;
    return {
      entries,
      myEntry,
      topExpandedCount: config.topExpandedCount,
      expandedByDefault: config.expandedByDefault,
    };
  }

  // The viewer's own leaderboard row — shown even at 0 points so they see where
  // they stand. Null when the user has no membership at this artist. Rank =
  // members with a strictly higher balance + 1 (0-balance members tie at the end).
  async getMyLeaderboardEntry(userId: string, slug: string): Promise<LeaderboardEntryDto | null> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: {
        id: true,
        user: { select: { email: true, avatarUrl: true, googleAvatarUrl: true } },
      },
    });
    if (!member) {
      return null;
    }
    const myBalance = await this.getBalance(member.id);
    const sums = await this.prisma.artistPointsTransaction.groupBy({
      by: ["artistUserId"],
      where: { artistUser: { artist: { slug } } },
      _sum: { amount: true },
    });
    const higher = sums.filter((s) => (s._sum.amount ?? 0) > myBalance).length;
    const socialsByMember = await this.getSocialsByMember([member.id]);
    return {
      rank: higher + 1,
      displayName: (member.user.email ?? "").split("@")[0] || "member",
      avatarUrl: member.user.avatarUrl ?? member.user.googleAvatarUrl,
      points: myBalance,
      socials: socialsByMember.get(member.id) ?? [],
    };
  }

  // Connected socials (visible links only) for the given members, keyed by
  // member id — drives the leaderboard social badges.
  private async getSocialsByMember(
    artistUserIds: string[],
  ): Promise<Map<string, LeaderboardSocialDto[]>> {
    const map = new Map<string, LeaderboardSocialDto[]>();
    if (artistUserIds.length === 0) {
      return map;
    }
    const connections = await this.prisma.artistUserSocialConnection.findMany({
      where: {
        artistUserId: { in: artistUserIds },
        artistSocialLink: { isVisible: true, socialPlatform: { isActive: true } },
      },
      orderBy: { artistSocialLink: { sortOrder: "asc" } },
      select: {
        artistUserId: true,
        externalHandleOrUrl: true,
        artistSocialLink: { select: { socialPlatform: { select: { slug: true, label: true } } } },
      },
    });
    for (const c of connections) {
      const list = map.get(c.artistUserId) ?? [];
      list.push({
        platformSlug: c.artistSocialLink.socialPlatform.slug,
        platformLabel: c.artistSocialLink.socialPlatform.label,
        externalHandleOrUrl: c.externalHandleOrUrl,
      });
      map.set(c.artistUserId, list);
    }
    return map;
  }

  // Per-member balances for the artist (members with ledger entries). The
  // purchase preview computes current/predicted rank + next-rank target from one
  // fetch instead of several groupBys.
  async getMemberBalanceSums(slug: string): Promise<{ artistUserId: string; balance: number }[]> {
    const sums = await this.prisma.artistPointsTransaction.groupBy({
      by: ["artistUserId"],
      where: { artistUser: { artist: { slug } } },
      _sum: { amount: true },
    });
    return sums.map((s) => ({ artistUserId: s.artistUserId, balance: s._sum.amount ?? 0 }));
  }

  // Top-N members of an artist by balance (members with ledger entries).
  // displayName is the email local-part for now (Profile adds real names later).
  async getLeaderboard(slug: string, limit: number): Promise<LeaderboardEntryDto[]> {
    const top = await this.prisma.artistPointsTransaction.groupBy({
      by: ["artistUserId"],
      where: { artistUser: { artist: { slug } } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });
    if (top.length === 0) {
      return [];
    }
    const members = await this.prisma.artistUser.findMany({
      where: { id: { in: top.map((t) => t.artistUserId) } },
      select: {
        id: true,
        user: { select: { email: true, avatarUrl: true, googleAvatarUrl: true } },
      },
    });
    const emailById = new Map(members.map((m) => [m.id, m.user.email]));
    const avatarById = new Map(
      members.map((m) => [m.id, m.user.avatarUrl ?? m.user.googleAvatarUrl]),
    );
    const socialsByMember = await this.getSocialsByMember(top.map((t) => t.artistUserId));
    return top.map((t, i) => ({
      rank: i + 1,
      displayName: (emailById.get(t.artistUserId) ?? "").split("@")[0] || "member",
      avatarUrl: avatarById.get(t.artistUserId) ?? null,
      points: t._sum.amount ?? 0,
      socials: socialsByMember.get(t.artistUserId) ?? [],
    }));
  }
}
