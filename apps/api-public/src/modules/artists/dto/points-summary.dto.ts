import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PointsSummaryResponseDto {
  @Expose()
  @ApiProperty({ description: "Current points balance." })
  balance!: number;

  @Expose()
  @ApiProperty({ description: "Lifetime points earned (sum of positive ledger entries)." })
  totalEarned!: number;
}
