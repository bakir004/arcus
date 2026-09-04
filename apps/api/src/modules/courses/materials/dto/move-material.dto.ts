import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';

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
