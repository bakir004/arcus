import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
    @ApiProperty({ example: 'Buy groceries', description: 'Short todo title.' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({
        example: 'Milk, bread, and vegetables',
        description: 'Additional details for the todo.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}
