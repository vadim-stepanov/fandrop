import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { Expose, Type } from "class-transformer";

class AdminEntryDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}

class PendingGrantDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}

export class AdminsListResponseDto {
  @Expose()
  @Type(() => AdminEntryDto)
  @ApiProperty({ type: AdminEntryDto, isArray: true })
  admins!: AdminEntryDto[];

  @Expose()
  @Type(() => PendingGrantDto)
  @ApiProperty({ type: PendingGrantDto, isArray: true })
  pending!: PendingGrantDto[];
}

export class AddAdminDto {
  @ApiProperty({ description: "Email to grant artist-admin access" })
  @IsEmail()
  email!: string;
}

export class AddAdminResponseDto {
  @Expose()
  @ApiProperty({ enum: ["instant", "pending"] })
  status!: "instant" | "pending";
}
