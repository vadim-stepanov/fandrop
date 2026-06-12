import { PartialType } from "@nestjs/swagger";

import { CreateQuestDto } from "./create-quest.dto";

// All fields optional; validators apply when a field is present.
export class UpdateQuestDto extends PartialType(CreateQuestDto) {}
