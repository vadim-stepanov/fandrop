import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AdminUserResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;

  @Expose()
  @ApiProperty({ enum: ["USER", "ARTIST_ADMIN"] })
  role!: string;

  @Expose()
  @ApiProperty({ description: "Current points balance (sum of the ledger)" })
  balance!: number;

  @Expose()
  @ApiProperty({ description: "Total points ever earned (sum of positive ledger entries)" })
  totalEarned!: number;

  @Expose()
  @ApiProperty()
  inventoryCount!: number;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Email of the member who referred this one",
  })
  referredByEmail!: string | null;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}
