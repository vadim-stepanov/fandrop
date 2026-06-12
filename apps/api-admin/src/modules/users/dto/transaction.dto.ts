import { ApiProperty } from "@nestjs/swagger";
import { ArtistPointsTransactionKind } from "@fandrop/db";
import { Expose, Type } from "class-transformer";

class TransactionEntryDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: "Signed points delta (negative = spent)" })
  amount!: number;

  @Expose()
  @ApiProperty({ enum: ArtistPointsTransactionKind })
  kind!: ArtistPointsTransactionKind;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;
}

export class TransactionPageResponseDto {
  @Expose()
  @Type(() => TransactionEntryDto)
  @ApiProperty({ type: TransactionEntryDto, isArray: true })
  entries!: TransactionEntryDto[];

  @Expose()
  @ApiProperty()
  page!: number;

  @Expose()
  @ApiProperty()
  totalPages!: number;

  @Expose()
  @ApiProperty()
  totalCount!: number;
}
