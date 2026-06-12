import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

class SocialConnectionDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  externalHandleOrUrl!: string;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  connectedAt!: Date;
}

export class ProfileSocialEntryResponseDto {
  @Expose()
  @ApiProperty()
  artistSocialLinkId!: string;

  @Expose()
  @ApiProperty()
  platformSlug!: string;

  @Expose()
  @ApiProperty()
  platformLabel!: string;

  @Expose()
  @ApiProperty()
  platformIcon!: string;

  @Expose()
  @ApiProperty()
  connectBonus!: number;

  @Expose()
  @Type(() => SocialConnectionDto)
  @ApiProperty({ type: SocialConnectionDto, nullable: true })
  connection!: SocialConnectionDto | null;
}
