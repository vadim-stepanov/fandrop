import { ApiProperty } from "@nestjs/swagger";
import { StoreCategory, StoreQuality } from "@fandrop/db";
import { Expose } from "class-transformer";

export class InventoryItemResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  storeItemId!: string | null;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  imageUrl!: string | null;

  @Expose()
  @ApiProperty({ enum: StoreCategory })
  category!: StoreCategory;

  @Expose()
  @ApiProperty({ enum: StoreQuality })
  quality!: StoreQuality;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  acquiredAt!: Date;
}
