import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LinkMaterial, FileMaterial, Material, TextMaterial } from '../materials.entity';

class MaterialResponseBase {
    @ApiProperty({ format: 'uuid' }) id: string;
    @ApiProperty({ format: 'uuid' }) courseGroupId: string;
    @ApiProperty({ description: 'User who uploaded the material.' }) uploadedById: string;
    @ApiProperty({ minimum: 0 }) position: number;
    @ApiProperty({ format: 'date-time' }) createdAt: Date;
    @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}

export class TextMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['TEXT'] }) kind: 'TEXT';
    @ApiProperty() textContent: string;

    static fromEntity(material: TextMaterial): TextMaterialResponseDto {
        return Object.assign(new TextMaterialResponseDto(), material);
    }
}

export class FileMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['FILE'] }) kind: 'FILE';
    @ApiProperty() title: string;
    @ApiPropertyOptional({ nullable: true }) description: string | null;
    @ApiProperty() fileKey: string;
    @ApiPropertyOptional({ nullable: true }) fileName: string | null;
    @ApiPropertyOptional({ nullable: true }) fileMimeType: string | null;
    @ApiPropertyOptional({ nullable: true }) fileSize: number | null;

    static fromEntity(material: FileMaterial): FileMaterialResponseDto {
        return Object.assign(new FileMaterialResponseDto(), material);
    }
}

export class LinkMaterialResponseDto extends MaterialResponseBase {
    @ApiProperty({ enum: ['LINK'] }) kind: 'LINK';
    @ApiProperty() title: string;
    @ApiPropertyOptional({ nullable: true }) description: string | null;
    @ApiProperty({ format: 'uri' }) externalUrl: string;

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
