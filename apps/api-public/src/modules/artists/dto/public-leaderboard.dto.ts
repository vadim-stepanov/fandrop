import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { LeaderboardEntryDto } from "./leaderboard-entry.dto";

export class PublicLeaderboardResponseDto {
  @Expose()
  @Type(() => LeaderboardEntryDto)
  @ApiProperty({ type: LeaderboardEntryDto, isArray: true })
  entries!: LeaderboardEntryDto[];

  @Expose()
  @Type(() => LeaderboardEntryDto)
  @ApiProperty({
    type: LeaderboardEntryDto,
    nullable: true,
    description: "The signed-in viewer's own row (null if anonymous / not a member)",
  })
  myEntry!: LeaderboardEntryDto | null;

  @Expose()
  @ApiProperty({ description: "Rows shown before 'Show more'" })
  topExpandedCount!: number;

  @Expose()
  @ApiProperty({ description: "Whether the list starts expanded" })
  expandedByDefault!: boolean;
}
