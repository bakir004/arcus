import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MaterialGroup } from '../materials.entity';
import { type MaterialResponseDto, materialResponseFromEntity } from './material-response.dto';

export class MaterialGroupResponseDto {
    @ApiProperty({ format: 'uuid' }) id: string;
    @ApiProperty({ format: 'uuid' }) courseId: string;
    @ApiProperty({ minimum: 0 }) position: number;
    @ApiProperty() name: string;
    @ApiPropertyOptional({ nullable: true }) description: string | null;
    @ApiProperty({ isArray: true }) materials: MaterialResponseDto[];
    @ApiProperty({ format: 'date-time' }) createdAt: Date;
    @ApiProperty({ format: 'date-time' }) updatedAt: Date;

    static fromEntity(group: MaterialGroup): MaterialGroupResponseDto {
        return Object.assign(new MaterialGroupResponseDto(), group, {
            materials: group.materials.map(materialResponseFromEntity),
        });
    }
}
