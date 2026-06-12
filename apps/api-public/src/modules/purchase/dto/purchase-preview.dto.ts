import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

class NextRankTargetDto {
  @Expose()
  @ApiProperty()
  rank!: number;

  @Expose()
  @ApiProperty()
  pointsNeeded!: number;
}

export class PurchasePreviewResponseDto {
  @Expose()
  @ApiProperty()
  currentBalance!: number;

  @Expose()
  @ApiProperty()
  currentRank!: number;

  @Expose()
  @ApiProperty({ description: "Balance after the purchase (− points cost + loyalty reward)." })
  projectedBalance!: number;

  @Expose()
  @ApiProperty({ description: "Leaderboard rank the buyer would hold after the purchase." })
  predictedRank!: number;

  @Expose()
  @ApiProperty({ description: "Points cost (0 for MONEY items)." })
  pointsCost!: number;

  @Expose()
  @ApiProperty({ description: "Loyalty points awarded by this purchase." })
  loyaltyAward!: number;

  @Expose()
  @ApiProperty({ description: "Whether the buyer can afford it (always true for MONEY)." })
  affordable!: boolean;

  @Expose()
  @Type(() => NextRankTargetDto)
  @ApiProperty({
    type: NextRankTargetDto,
    nullable: true,
    description: "Rank just above the projected position + points to reach it; null at top.",
  })
  nextRankTarget!: NextRankTargetDto | null;
}
