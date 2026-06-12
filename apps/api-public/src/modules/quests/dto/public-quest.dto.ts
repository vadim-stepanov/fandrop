import { ApiProperty } from "@nestjs/swagger";
import { QuestStatus } from "@fandrop/db";
import { Expose } from "class-transformer";

export class PublicQuestResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty()
  link!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  imageUrl!: string | null;

  @Expose()
  @ApiProperty()
  rewardPoints!: number;

  @Expose()
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  availableAt!: Date | null;

  @Expose()
  @ApiProperty({ enum: QuestStatus })
  status!: QuestStatus;
}

export class QuestActionResultResponseDto {
  @Expose()
  @ApiProperty({ enum: QuestStatus })
  status!: QuestStatus;
}

export class QuestClaimResultResponseDto {
  @Expose()
  @ApiProperty()
  claimed!: boolean;

  @Expose()
  @ApiProperty()
  amount!: number;
}

export class QuestUnclaimedResponseDto {
  @Expose()
  @ApiProperty()
  count!: number;
}
