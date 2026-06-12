import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class RequestOtpDto {
  @ApiProperty({ example: "fan@example.com", description: "Email the OTP code is sent to" })
  @IsEmail()
  email!: string;
}
