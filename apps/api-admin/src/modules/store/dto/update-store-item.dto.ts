import { PartialType } from "@nestjs/swagger";

import { CreateStoreItemDto } from "./create-store-item.dto";

// All fields optional; validators apply when a field is present.
export class UpdateStoreItemDto extends PartialType(CreateStoreItemDto) {}
