import { ForbiddenException, Injectable } from "@nestjs/common";
import { ARTIST_ACTIVITY } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { PrismaService } from "../../common/prisma/prisma.service";
import { ClaimResultResponseDto, OnboardingStateResponseDto } from "./dto/onboarding-state.dto";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  async getState(userId: string, slug: string): Promise<OnboardingStateResponseDto> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { hasSeenOnboarding: true, artist: { select: { signupBonusPoints: true } } },
    });
    if (!member) {
      return { isMember: false, hasSeenOnboarding: true, welcomeBonus: 0 };
    }
    return {
      isMember: true,
      hasSeenOnboarding: member.hasSeenOnboarding,
      welcomeBonus: member.artist.signupBonusPoints,
    };
  }

  // Credit the welcome bonus once (the modal's "Claim points" button).
  // Idempotent: a WELCOME_BONUS ledger row is the canonical "already claimed"
  // marker (checked inside the tx), so re-clicking credits at most once. This
  // is independent of hasSeenOnboarding, which the separate complete() flips.
  async claim(userId: string, slug: string): Promise<ClaimResultResponseDto> {
    const member = await this.memberOrThrow(userId, slug);

    const result = await this.prisma.$transaction(async (tx): Promise<ClaimResultResponseDto> => {
      const artistUser = await tx.artistUser.findFirst({
        where: { userId, artist: { slug } },
        select: { id: true, artistId: true, artist: { select: { signupBonusPoints: true } } },
      });
      if (!artistUser) {
        return { claimed: false, bonusAmount: 0 };
      }
      const bonus = Math.max(0, artistUser.artist.signupBonusPoints);
      if (bonus === 0) {
        return { claimed: false, bonusAmount: 0 };
      }
      const already = await tx.artistPointsTransaction.findFirst({
        where: { artistUserId: artistUser.id, kind: "WELCOME_BONUS" },
        select: { id: true },
      });
      if (already) {
        return { claimed: false, bonusAmount: 0 };
      }
      await tx.artistPointsTransaction.create({
        data: {
          artistUserId: artistUser.id,
          amount: bonus,
          kind: "WELCOME_BONUS",
          description: "Welcome bonus claimed via onboarding",
        },
      });
      return { claimed: true, bonusAmount: bonus };
    });

    // Points earned → balance/leaderboard changed; signal viewers + admin.
    if (result.claimed) {
      await this.bus.publish(ARTIST_ACTIVITY, {
        artistId: member.artistId,
        userId,
        kind: "welcome-bonus",
      });
    }
    return result;
  }

  // Mark onboarding as seen (final "Let's go!" / early close) so the modal
  // never shows again. Idempotent; ownership-scoped.
  async complete(userId: string, slug: string): Promise<void> {
    await this.prisma.artistUser.updateMany({
      where: { userId, artist: { slug } },
      data: { hasSeenOnboarding: true },
    });
  }

  private async memberOrThrow(userId: string, slug: string): Promise<{ artistId: string }> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { artistId: true },
    });
    if (!member) {
      throw new ForbiddenException("Not a member of this artist");
    }
    return member;
  }
}
