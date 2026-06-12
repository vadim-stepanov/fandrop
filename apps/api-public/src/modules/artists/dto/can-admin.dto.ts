import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CanAdminResponseDto {
  @Expose()
  @ApiProperty({
    description:
      "Whether the signed-in viewer is an admin of this artist (can open the admin panel).",
  })
  canOpenAdmin!: boolean;
}
