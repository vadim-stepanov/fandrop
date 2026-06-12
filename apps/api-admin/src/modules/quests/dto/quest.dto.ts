import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class QuestResponseDto {
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
  @ApiProperty()
  featuredPos!: number;

  @Expose()
  @ApiProperty()
  isVisible!: boolean;
}
