import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StoreCategory, StorePriceMode, StoreQuality } from "@fandrop/db";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateStoreItemDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @ApiProperty({ enum: StoreCategory })
  @IsEnum(StoreCategory)
  category!: StoreCategory;

  @ApiPropertyOptional({ enum: StoreQuality, default: StoreQuality.COMMON })
  @IsOptional()
  @IsEnum(StoreQuality)
  quality?: StoreQuality;

  @ApiPropertyOptional({ enum: StorePriceMode, default: StorePriceMode.MONEY })
  @IsOptional()
  @IsEnum(StorePriceMode)
  priceMode?: StorePriceMode;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceAmountCents?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsPrice?: number | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loyaltyPoints?: number;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockCount?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leftAlert?: number | null;

  @ApiPropertyOptional({ type: String, format: "date-time", nullable: true })
  @IsOptional()
  @IsISO8601()
  salesStartAt?: string | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  featuredPos?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
