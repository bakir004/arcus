import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto';

export class EditTodoDto extends PartialType(CreateTodoDto) {
    @ApiPropertyOptional({
        example: true,
        description: 'Whether the todo has been completed.',
    })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
