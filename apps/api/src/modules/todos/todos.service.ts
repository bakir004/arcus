import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { EditTodoDto } from './dto/edit-todo.dto';
import { Todo } from './todos.entity';
import { TodoNotFound } from './todos.errors';
import { TodosRepository } from './todos.repository';

@Injectable()
export class TodosService {
    constructor(private readonly repository: TodosRepository) {}

    findAll(): Promise<Todo[]> {
        return this.repository.findAll();
    }

    async findOne(id: string): Promise<Todo> {
        const todo = await this.repository.findById(id);
        if (!todo) throw TodoNotFound(id);
        return todo;
    }

    create(dto: CreateTodoDto): Promise<Todo> {
        return this.repository.create({
            title: dto.title,
            description: dto.description ?? null,
        });
    }

    async update(id: string, dto: EditTodoDto): Promise<Todo> {
        const todo = await this.repository.update(id, dto);
        if (!todo) throw TodoNotFound(id);
        return todo;
    }

    async remove(id: string): Promise<void> {
        if (!(await this.repository.delete(id))) throw TodoNotFound(id);
    }
}
