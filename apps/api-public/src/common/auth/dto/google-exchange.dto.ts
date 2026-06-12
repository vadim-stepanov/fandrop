import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GoogleExchangeDto {
  @ApiProperty({ description: "Authorization code from Google's redirect" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: "Opaque state issued at /auth/google/start" })
  @IsString()
  @IsNotEmpty()
  state!: string;
}
