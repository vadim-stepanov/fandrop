import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateReferralSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  referralEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  referralRewardPoints?: number;
}
