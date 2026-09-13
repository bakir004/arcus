import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import {
    MATERIAL_KINDS,
    type FileMaterial,
    type LinkMaterial,
    type Material,
    type MaterialGroup,
    type MaterialKind,
    type TextMaterial,
} from './materials.entity';
import { getAllMaterialRepositories } from './materials.repository.registry';

const groupIdApiSchema = {
    type: 'object',
    properties: {
        groupId: { type: 'string', format: 'uuid', description: 'Optional destination group.' },
    },
};

export const materialCreateApiSchema = {
    type: 'object',
    discriminator: { propertyName: 'kind' },
    oneOf: getAllMaterialRepositories().map((repository) => ({
        allOf: [repository.apiSchema, groupIdApiSchema],
    })),
};

export class CreateMaterialGroupDto {
    @ApiProperty({ example: 'Lecture notes' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiPropertyOptional({ example: 'Notes and supporting resources.' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;
}

export class EditMaterialGroupDto extends PartialType(CreateMaterialGroupDto) {}

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

export const materialUpdateApiSchema = {
    type: 'object',
    discriminator: { propertyName: 'kind' },
    description: 'A partial type-specific update. If kind is omitted, the existing material kind is retained.',
    oneOf: getAllMaterialRepositories().map((repository) => repository.updateApiSchema),
};

export class EditMaterialDto extends PartialType(CreateMaterialDto) {}

export class MoveMaterialDto {
    @ApiPropertyOptional({
        format: 'uuid',
        nullable: true,
        description: 'Destination group. Null moves the material to the root.',
    })
    @IsOptional()
    @ValidateIf((dto: MoveMaterialDto) => dto.groupId !== null)
    @IsUUID()
    groupId?: string | null;

    @ApiProperty({ minimum: 0 })
    @IsInt()
    @Min(0)
    position: number;
}

export class ReorderMaterialGroupDto {
    @ApiProperty({ minimum: 0 })
    @IsInt()
    @Min(0)
    position: number;
}

class MaterialResponseBase {
    @ApiProperty({ format: 'uuid' })
    id: string;
    @ApiProperty({ format: 'uuid' })
    courseGroupId: string;
    @ApiProperty({ description: 'User who uploaded the material.' })
    uploadedById: string;
    @ApiProperty({ minimum: 0 })
    position: number;
    @ApiProperty({ format: 'date-time' })
    createdAt: Date;
    @ApiProperty({ format: 'date-time' })
    updatedAt: Date;
}

export class TextMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['TEXT'] })
    kind: 'TEXT';
    @ApiProperty()
    textContent: string;

    static fromEntity(material: TextMaterial): TextMaterialResponseDto {
        return Object.assign(new TextMaterialResponseDto(), material);
    }
}

export class FileMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['FILE'] })
    kind: 'FILE';
    @ApiProperty()
    title: string;
    @ApiPropertyOptional({ nullable: true })
    description: string | null;
    @ApiProperty()
    fileKey: string;
    @ApiPropertyOptional({ nullable: true })
    fileName: string | null;
    @ApiPropertyOptional({ nullable: true })
    fileMimeType: string | null;
    @ApiPropertyOptional({ nullable: true })
    fileSize: number | null;

    static fromEntity(material: FileMaterial): FileMaterialResponseDto {
        return Object.assign(new FileMaterialResponseDto(), material);
    }
}

export class LinkMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['LINK'] })
    kind: 'LINK';
    @ApiProperty()
    title: string;
    @ApiPropertyOptional({ nullable: true })
    description: string | null;
    @ApiProperty({ format: 'uri' })
    externalUrl: string;

    static fromEntity(material: LinkMaterial): LinkMaterialResponseDto {
        return Object.assign(new LinkMaterialResponseDto(), material);
    }
}

export type MaterialResponseDto = TextMaterialResponseDto | FileMaterialResponseDto | LinkMaterialResponseDto;

export function materialResponseFromEntity(material: Material): MaterialResponseDto {
    switch (material.kind) {
        case 'TEXT':
            return TextMaterialResponseDto.fromEntity(material);
        case 'FILE':
            return FileMaterialResponseDto.fromEntity(material);
        case 'LINK':
            return LinkMaterialResponseDto.fromEntity(material);
    }
}

export class MaterialGroupResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;
    @ApiProperty({ format: 'uuid' })
    courseId: string;
    @ApiProperty({ minimum: 0 })
    position: number;
    @ApiProperty()
    name: string;
    @ApiPropertyOptional({ nullable: true })
    description: string | null;
    @ApiProperty({ isArray: true })
    materials: MaterialResponseDto[];
    @ApiProperty({ format: 'date-time' })
    createdAt: Date;
    @ApiProperty({ format: 'date-time' })
    updatedAt: Date;

    static fromEntity(group: MaterialGroup): MaterialGroupResponseDto {
        return Object.assign(new MaterialGroupResponseDto(), group, {
            materials: group.materials.map(materialResponseFromEntity),
        });
    }
}
