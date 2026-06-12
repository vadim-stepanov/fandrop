import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PublicPartnerResponseDto {
  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  logoUrl!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  externalUrl!: string | null;
}
