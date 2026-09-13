import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import type { Material, MaterialGroup } from './materials.entity';
import { getAllMaterialRepositories, getMaterialRepository } from './materials.repository.registry';

const materialInputApiProperty = {
    discriminator: { propertyName: 'kind' },
    oneOf: getAllMaterialRepositories().map((repository) => repository.inputApiSchema),
};

export const materialResponseApiSchema = {
    discriminator: { propertyName: 'kind' },
    oneOf: getAllMaterialRepositories().map((repository) => repository.responseApiSchema),
};

const parseMultipartObject = ({ value }: { value: unknown }): unknown => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

export const materialCreateApiSchema = {
    type: 'object',
    required: ['input'],
    properties: {
        groupId: { type: 'string', format: 'uuid', description: 'Optional destination group.' },
        input: {
            ...materialInputApiProperty,
            description: 'Type-specific material input. The kind property is the discriminator.',
        },
        file: {
            type: 'string',
            format: 'binary',
            description: 'Required when input.kind is FILE.',
        },
    },
};

export const materialUpdateApiSchema = {
    type: 'object',
    properties: {
        input: {
            ...materialInputApiProperty,
            description:
                'Complete type-specific replacement input. Omit it to retain the current input; kind changes require it.',
        },
        file: {
            type: 'string',
            format: 'binary',
            description: 'Optional replacement file for FILE materials; required when changing to FILE.',
        },
    },
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
    @ApiProperty({
        ...materialInputApiProperty,
        description: 'Type-specific material input. The kind property is the discriminator.',
    })
    @Transform(parseMultipartObject)
    @IsObject()
    input: object;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    groupId?: string;
}

export class EditMaterialDto {
    @ApiPropertyOptional({
        ...materialInputApiProperty,
        description:
            'Complete type-specific replacement input. Omit it to retain the current input; kind changes require it.',
    })
    @Transform(parseMultipartObject)
    @IsOptional()
    @IsObject()
    input?: object;
}

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

export type MaterialResponseDto = Material;

export function materialResponseFromEntity(material: Material): MaterialResponseDto {
    return getMaterialRepository(material.kind).toResponse(material);
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
    @ApiProperty({ type: 'array', items: materialResponseApiSchema })
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
