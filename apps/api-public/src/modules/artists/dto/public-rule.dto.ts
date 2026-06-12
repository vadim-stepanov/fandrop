import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PublicRuleResponseDto {
  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  body!: string | null;
}
