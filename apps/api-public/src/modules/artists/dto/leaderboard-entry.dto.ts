import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class LeaderboardSocialDto {
  @Expose()
  @ApiProperty()
  platformSlug!: string;

  @Expose()
  @ApiProperty()
  platformLabel!: string;

  @Expose()
  @ApiProperty()
  externalHandleOrUrl!: string;
}

export class LeaderboardEntryDto {
  @Expose()
  @ApiProperty()
  rank!: number;

  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;

  @Expose()
  @ApiProperty()
  points!: number;

  @Expose()
  @Type(() => LeaderboardSocialDto)
  @ApiProperty({ type: LeaderboardSocialDto, isArray: true })
  socials!: LeaderboardSocialDto[];
}
