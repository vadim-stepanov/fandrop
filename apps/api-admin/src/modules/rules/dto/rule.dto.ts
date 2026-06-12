import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class RuleResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  body!: string | null;

  @Expose()
  @ApiProperty()
  stepNumber!: number;

  @Expose()
  @ApiProperty()
  isVisible!: boolean;
}
