import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class SocialPlatformResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty()
  label!: string;

  @Expose()
  @ApiProperty({ description: "Brand-icon slug (public/brand-icons/<icon>.svg)." })
  icon!: string;
}
