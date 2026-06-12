import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

class AuditEntryDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  adminEmail!: string | null;

  @Expose()
  @ApiProperty()
  action!: string;

  @Expose()
  @ApiProperty()
  entityType!: string;

  @Expose()
  @ApiProperty()
  entityId!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  reason!: string | null;

  // Arbitrary JSON snapshot, no nested DTO shape — left untyped on purpose so
  // it passes through the serializer unfiltered (see CLAUDE.md DTO runtime-enforce note).
  @Expose()
  @ApiProperty({ type: Object, nullable: true, description: "Row snapshot before the change" })
  beforePayload!: unknown;

  @Expose()
  @ApiProperty({ type: Object, nullable: true, description: "Row snapshot after the change" })
  afterPayload!: unknown;
}

export class AuditPageResponseDto {
  @Expose()
  @Type(() => AuditEntryDto)
  @ApiProperty({ type: AuditEntryDto, isArray: true })
  entries!: AuditEntryDto[];

  @Expose()
  @ApiProperty()
  page!: number;

  @Expose()
  @ApiProperty()
  totalPages!: number;
}
