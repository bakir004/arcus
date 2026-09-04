import { PartialType } from '@nestjs/swagger';
import { CreateMaterialGroupDto } from './create-group.dto';

export class EditMaterialGroupDto extends PartialType(CreateMaterialGroupDto) {}
