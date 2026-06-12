import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSocialLinkDto {
  @ApiProperty({ description: "SocialPlatform id from the catalog." })
  @IsString()
  socialPlatformId!: string;

  @ApiPropertyOptional({ minimum: 0, default: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  connectBonus?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
