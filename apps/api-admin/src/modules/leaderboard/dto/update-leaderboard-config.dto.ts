import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateLeaderboardConfigDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  topExpandedCount?: number;

  @ApiPropertyOptional({ minimum: 10, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(50)
  visibleUserCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expandedByDefault?: boolean;
}
