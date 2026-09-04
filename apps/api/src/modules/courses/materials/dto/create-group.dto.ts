import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
