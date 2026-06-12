import { ApiProperty } from "@nestjs/swagger";
import { ArtistPointsTransactionKind } from "@fandrop/db";
import { Expose, Type } from "class-transformer";

class TransactionDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ description: "Signed points delta (positive = earned, negative = spent)." })
  amount!: number;

  @Expose()
  @ApiProperty({ enum: ArtistPointsTransactionKind })
  kind!: ArtistPointsTransactionKind;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}

export class TransactionPageResponseDto {
  @Expose()
  @Type(() => TransactionDto)
  @ApiProperty({ type: TransactionDto, isArray: true })
  entries!: TransactionDto[];

  @Expose()
  @ApiProperty()
  page!: number;

  @Expose()
  @ApiProperty()
  totalPages!: number;
}
