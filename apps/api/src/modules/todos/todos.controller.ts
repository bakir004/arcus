import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/error.dto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { EditTodoDto } from './dto/edit-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { TodosService } from './todos.service';

@ApiTags('Todos')
@Controller('todos')
export class TodosController {
    constructor(private readonly service: TodosService) {}
    @Get()
    @ApiOperation({ summary: 'List todos' })
    @ApiOkResponse({ type: TodoResponseDto, isArray: true })
    async findAll(): Promise<TodoResponseDto[]> {
        return (await this.service.findAll()).map(TodoResponseDto.fromEntity);
    }
    @Get(':id')
    @ApiOperation({ summary: 'Get a todo by ID' })
    @ApiParam({ name: 'id' })
    @ApiOkResponse({ type: TodoResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    async findOne(@Param('id') id: string): Promise<TodoResponseDto> {
        return TodoResponseDto.fromEntity(await this.service.findOne(id));
    }
    @Post()
    @ApiOperation({ summary: 'Create a todo' })
    @ApiCreatedResponse({ type: TodoResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    async create(@Body() dto: CreateTodoDto): Promise<TodoResponseDto> {
        return TodoResponseDto.fromEntity(await this.service.create(dto));
    }
    @Patch(':id')
    @ApiOperation({ summary: 'Edit a todo' })
    @ApiParam({ name: 'id' })
    @ApiOkResponse({ type: TodoResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    async update(
        @Param('id') id: string,
        @Body() dto: EditTodoDto,
    ): Promise<TodoResponseDto> {
        return TodoResponseDto.fromEntity(await this.service.update(id, dto));
    }
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a todo' })
    @ApiParam({ name: 'id' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    async remove(@Param('id') id: string): Promise<void> {
        await this.service.remove(id);
    }
}
