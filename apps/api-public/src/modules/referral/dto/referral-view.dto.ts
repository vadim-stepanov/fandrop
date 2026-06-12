import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ReferralViewResponseDto {
  @Expose()
  @ApiProperty({ description: "Whether the artist runs a referral program" })
  enabled!: boolean;

  @Expose()
  @ApiProperty({ description: "The viewer's referral code" })
  code!: string;

  @Expose()
  @ApiProperty({ description: "Reward per successful referral (both sides earn it)" })
  rewardPerReferral!: number;

  @Expose()
  @ApiProperty()
  usersInvited!: number;

  @Expose()
  @ApiProperty()
  pointsFromReferrals!: number;
}
