import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BalanceResponseDto {
  @Expose()
  @ApiProperty()
  balance!: number;
}

export class AvatarResponseDto {
  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}
