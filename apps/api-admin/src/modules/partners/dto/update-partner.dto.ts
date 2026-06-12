import { PartialType } from "@nestjs/swagger";

import { CreatePartnerDto } from "./create-partner.dto";

// All fields optional; validators apply when a field is present.
export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}
