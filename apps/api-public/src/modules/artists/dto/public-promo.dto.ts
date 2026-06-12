import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PublicPromoResponseDto {
  @Expose()
  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  subtitle!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  ctaLabel!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  ctaUrl!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  ctaText!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  bannerUrl!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  videoUrl!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  bannerUrlAnon!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  eyebrow!: string | null;

  @Expose()
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  timerEndsAt!: Date | null;
}
