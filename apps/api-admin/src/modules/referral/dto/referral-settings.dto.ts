import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ReferralSettingsResponseDto {
  @Expose()
  @ApiProperty()
  referralEnabled!: boolean;

  @Expose()
  @ApiProperty({ minimum: 0 })
  referralRewardPoints!: number;
}
