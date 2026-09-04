import { PartialType } from '@nestjs/swagger';
import { CreateMaterialDto } from './create-material.dto';

export class EditMaterialDto extends PartialType(CreateMaterialDto) {}
