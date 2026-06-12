import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { Expose } from "class-transformer";

export class MemberQuestResponseDto {
  @Expose()
  @ApiProperty()
  questId!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty()
  rewardPoints!: number;

  @Expose()
  @ApiProperty()
  status!: string;
}

export class SetMemberQuestStatusDto {
  @ApiProperty({ enum: ["NOT_STARTED", "COMPLETED"] })
  @IsIn(["NOT_STARTED", "COMPLETED"])
  status!: "NOT_STARTED" | "COMPLETED";
}
