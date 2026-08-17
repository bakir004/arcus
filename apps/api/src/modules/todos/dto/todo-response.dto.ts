import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Todo } from '../todos.entity';

export class TodoResponseDto {
    @ApiProperty({ example: '6f8d4d1e-7d1b-4f6c-9b25-2f4e3b9d6a10' })
    id: string;

    @ApiProperty({ example: 'Buy groceries' })
    title: string;

    @ApiPropertyOptional({ example: 'Milk, bread, and vegetables' })
    description?: string;

    @ApiProperty({ example: false })
    completed: boolean;

    @ApiProperty({ example: '2026-08-17T14:00:00.000Z', format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ example: '2026-08-17T14:00:00.000Z', format: 'date-time' })
    updatedAt: Date;

    static fromEntity(todo: Todo): TodoResponseDto {
        return Object.assign(new TodoResponseDto(), todo);
    }
}
