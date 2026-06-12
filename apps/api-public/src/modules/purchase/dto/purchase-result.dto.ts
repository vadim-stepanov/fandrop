import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PurchaseResultResponseDto {
  @Expose()
  @ApiProperty()
  newBalance!: number;

  @Expose()
  @ApiProperty()
  newRank!: number;

  @Expose()
  @ApiProperty()
  inventoryItemId!: string;
}
