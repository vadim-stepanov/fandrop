import { PartialType } from "@nestjs/swagger";

import { CreatePromoDto } from "./create-promo.dto";

// All fields optional; validators apply when a field is present.
export class UpdatePromoDto extends PartialType(CreatePromoDto) {}
