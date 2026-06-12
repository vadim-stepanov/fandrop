import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({ example: "fan@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "123456", description: "6-digit code from the email" })
  @Matches(/^\d{6}$/, { message: "code must be 6 digits" })
  code!: string;

  // Artist context of the login (the auth modal lives on /artist/<slug>).
  // When present, a membership (ArtistUser) is ensured for this artist.
  @ApiPropertyOptional({ description: "Artist slug — ensures membership on login" })
  @IsOptional()
  @IsString()
  artistSlug?: string;

  // Referral code captured at signup (from a /artist/<slug>?ref=CODE link).
  // Applied only on first join; invalid codes are ignored server-side.
  @ApiPropertyOptional({ description: "Referral code — rewards both sides on first join" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;
}
