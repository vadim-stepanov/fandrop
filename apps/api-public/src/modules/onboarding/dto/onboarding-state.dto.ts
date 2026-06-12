import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class OnboardingStateResponseDto {
  @Expose()
  @ApiProperty()
  isMember!: boolean;

  @Expose()
  @ApiProperty()
  hasSeenOnboarding!: boolean;

  @Expose()
  @ApiProperty()
  welcomeBonus!: number;
}

export class ClaimResultResponseDto {
  @Expose()
  @ApiProperty()
  claimed!: boolean;

  @Expose()
  @ApiProperty()
  bonusAmount!: number;
}
