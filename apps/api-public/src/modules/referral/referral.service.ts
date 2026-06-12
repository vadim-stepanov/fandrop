import { ForbiddenException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../common/prisma/prisma.service";
import { ReferralViewResponseDto } from "./dto/referral-view.dto";
import { generateReferralCode } from "./referral-code";

const CODE_MAX_ATTEMPTS = 8;

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  // The viewer's referral panel: their code (generated on first read) + stats +
  // whether the program is on.
  async getReferral(userId: string, slug: string): Promise<ReferralViewResponseDto> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: {
        id: true,
        referralCode: true,
        artist: { select: { referralEnabled: true, referralRewardPoints: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException("Not a member of this artist");
    }

    const code = member.referralCode ?? (await this.ensureCode(member.id));
    const [usersInvited, pointsAgg] = await Promise.all([
      this.prisma.artistUser.count({ where: { referredByArtistUserId: member.id } }),
      this.prisma.artistPointsTransaction.aggregate({
        where: { artistUserId: member.id, kind: "REFERRAL_REWARD" },
        _sum: { amount: true },
      }),
    ]);

    return {
      enabled: member.artist.referralEnabled,
      code,
      rewardPerReferral: member.artist.referralRewardPoints,
      usersInvited,
      pointsFromReferrals: pointsAgg._sum.amount ?? 0,
    };
  }

  // Assign a unique code to a member that doesn't have one yet. Retries on the
  // referralCode @unique constraint (P2002) — defence-in-depth against the
  // astronomically rare collision.
  private async ensureCode(artistUserId: string): Promise<string> {
    for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt += 1) {
      const code = generateReferralCode();
      try {
        await this.prisma.artistUser.update({
          where: { id: artistUserId },
          data: { referralCode: code },
        });
        return code;
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          continue;
        }
        throw error;
      }
    }
    throw new Error("Could not generate a unique referral code");
  }
}
