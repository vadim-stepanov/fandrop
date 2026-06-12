import { ApiProperty } from "@nestjs/swagger";
import { ArtistHomeSectionKey } from "@fandrop/db";
import { Expose, Type } from "class-transformer";

class PublicHomeSectionDto {
  @Expose()
  @ApiProperty({ enum: ArtistHomeSectionKey, enumName: "ArtistHomeSectionKey" })
  key!: ArtistHomeSectionKey;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  subtitle!: string | null;
}

export class PublicArtistHomeResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  logoUrl!: string | null;

  @Expose()
  @ApiProperty()
  referralEnabled!: boolean;

  @Expose()
  @ApiProperty()
  referralRewardPoints!: number;

  @Expose()
  @Type(() => PublicHomeSectionDto)
  @ApiProperty({ type: PublicHomeSectionDto, isArray: true })
  sections!: PublicHomeSectionDto[];
}
