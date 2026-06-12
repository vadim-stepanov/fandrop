import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { SocialPlatformResponseDto } from "./social-platform.dto";

export class ArtistSocialLinkResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ description: "Points awarded the first time a member connects this platform." })
  connectBonus!: number;

  @Expose()
  @ApiProperty()
  sortOrder!: number;

  @Expose()
  @ApiProperty()
  isVisible!: boolean;

  @Expose()
  @Type(() => SocialPlatformResponseDto)
  @ApiProperty({ type: SocialPlatformResponseDto })
  socialPlatform!: SocialPlatformResponseDto;
}
