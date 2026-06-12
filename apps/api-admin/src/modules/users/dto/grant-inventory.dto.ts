import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GrantInventoryDto {
  @ApiProperty({ description: "Store item to grant (copied into the member's inventory)" })
  @IsString()
  @IsNotEmpty()
  storeItemId!: string;
}
