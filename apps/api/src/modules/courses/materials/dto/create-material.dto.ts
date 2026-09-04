import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { MATERIAL_KINDS, type MaterialKind } from '../materials.entity';

export class CreateMaterialDto {
    @ApiProperty({ enum: MATERIAL_KINDS })
    @IsIn(MATERIAL_KINDS)
    kind: MaterialKind;

    @ApiPropertyOptional({ description: 'Required when kind is TEXT.' })
    @ValidateIf((dto: CreateMaterialDto) => dto.kind === 'TEXT')
    @IsString()
    @IsNotEmpty()
    @MaxLength(100_000)
    textContent?: string;

    @ApiPropertyOptional({ description: 'Required for FILE and LINK materials.' })
    @ValidateIf((dto: CreateMaterialDto) => dto.kind === 'FILE' || dto.kind === 'LINK')
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ description: 'Optional description for FILE and LINK materials.' })
    @ValidateIf((dto: CreateMaterialDto) => dto.kind === 'FILE' || dto.kind === 'LINK')
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;

    @ApiPropertyOptional({
        description: 'Required when kind is LINK.',
        example: 'https://example.com/resource',
    })
    @ValidateIf((dto: CreateMaterialDto) => dto.kind === 'LINK')
    @IsString()
    @IsNotEmpty()
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
    @MaxLength(2048)
    externalUrl?: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Required when kind is FILE.',
    })
    @ValidateIf((dto: CreateMaterialDto) => dto.kind === 'FILE')
    @IsOptional()
    file?: unknown;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsString()
    groupId?: string;
}
