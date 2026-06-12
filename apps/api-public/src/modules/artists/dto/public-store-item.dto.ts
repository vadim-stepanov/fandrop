import { ApiProperty } from "@nestjs/swagger";
import { StoreCategory, StorePriceMode, StoreQuality } from "@fandrop/db";
import { Expose } from "class-transformer";

export class PublicStoreItemResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

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
  @ApiProperty({ enum: StorePriceMode })
  priceMode!: StorePriceMode;

  @Expose()
  @ApiProperty({ type: Number, nullable: true })
  priceAmountCents!: number | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  currencyCode!: string | null;

  @Expose()
  @ApiProperty({ type: Number, nullable: true })
  pointsPrice!: number | null;

  @Expose()
  @ApiProperty()
  loyaltyPoints!: number;

  @Expose()
  @ApiProperty({ type: Number, nullable: true })
  stockCount!: number | null;

  @Expose()
  @ApiProperty({ type: Number, nullable: true })
  leftAlert!: number | null;

  @Expose()
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  salesStartAt!: Date | null;
}
