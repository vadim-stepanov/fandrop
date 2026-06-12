import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Expose } from "class-transformer";

export class ArtistSettingsResponseDto {
  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  logoUrl!: string | null;

  @Expose()
  @ApiProperty({ description: "Points granted to a fan on first join (awarding wired later)" })
  signupBonusPoints!: number;

  @Expose()
  @ApiProperty({ description: "Number of admins on this artist" })
  adminCount!: number;
}

export class UpdateArtistSettingsDto {
  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: "Logo URL, empty clears it" })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @ApiProperty({ minimum: 0, maximum: 1_000_000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  signupBonusPoints!: number;
}
