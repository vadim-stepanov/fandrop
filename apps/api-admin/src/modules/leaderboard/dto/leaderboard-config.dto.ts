import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class LeaderboardConfigResponseDto {
  @Expose()
  @ApiProperty({ minimum: 1, maximum: 10 })
  topExpandedCount!: number;

  @Expose()
  @ApiProperty({ minimum: 10, maximum: 50 })
  visibleUserCount!: number;

  @Expose()
  @ApiProperty()
  expandedByDefault!: boolean;
}
