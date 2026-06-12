import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

class MeUserDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}

class MeArtistDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  slug!: string;

  @Expose()
  @ApiProperty()
  name!: string;
}

export class MeResponseDto {
  @Expose()
  @Type(() => MeUserDto)
  @ApiProperty({ type: MeUserDto })
  user!: MeUserDto;

  @Expose()
  @Type(() => MeArtistDto)
  @ApiProperty({ type: MeArtistDto })
  artist!: MeArtistDto;
}
