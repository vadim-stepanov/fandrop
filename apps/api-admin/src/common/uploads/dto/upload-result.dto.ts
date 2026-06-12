import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UploadResultResponseDto {
  @Expose()
  @ApiProperty({ description: "Public URL of the uploaded file (served at /uploads)." })
  url!: string;
}
