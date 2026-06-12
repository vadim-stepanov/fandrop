import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

// Limits mirror the client text-limits (RULE_TITLE_MAX / RULE_BODY_MAX).
export class CreateRuleDto {
  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 90 })
  @IsOptional()
  @IsString()
  @MaxLength(90)
  body?: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stepNumber?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
