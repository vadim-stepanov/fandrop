import { ApiProperty } from "@nestjs/swagger";
import { ArtistHomeSectionKey } from "@fandrop/db";
import { Expose } from "class-transformer";

export class HomeSectionResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ enum: ArtistHomeSectionKey, enumName: "ArtistHomeSectionKey" })
  key!: ArtistHomeSectionKey;

  @Expose()
  @ApiProperty()
  isVisible!: boolean;

  @Expose()
  @ApiProperty()
  sortOrder!: number;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  subtitle!: string | null;
}
