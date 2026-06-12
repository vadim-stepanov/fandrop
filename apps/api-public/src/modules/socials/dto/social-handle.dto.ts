import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

// Connect / edit body. The handle-or-URL shape is validated in the service
// (isValidSocialHandleOrUrl) — here we just bound the length.
export class SocialHandleDto {
  @ApiProperty({ maxLength: 500, description: "A social handle (@name) or full http(s) URL." })
  @IsString()
  @MaxLength(500)
  externalHandleOrUrl!: string;
}
