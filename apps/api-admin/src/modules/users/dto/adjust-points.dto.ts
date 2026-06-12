import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, NotEquals } from "class-validator";

export class AdjustPointsDto {
  @ApiProperty({
    minimum: -1_000_000,
    maximum: 1_000_000,
    description: "Non-zero; negative deducts points",
  })
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  @NotEquals(0)
  amount!: number;

  @ApiPropertyOptional({ maxLength: 200, description: "Reason shown in the ledger" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
