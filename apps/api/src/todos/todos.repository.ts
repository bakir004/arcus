import { db, eq, todos } from '@/database';
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@/database/database.module';
import { Todo } from '@/todos/todos.entity';

@Injectable()
export class TodosRepository {
    constructor(@Inject(DATABASE) private readonly database: typeof db) {}

    findAll(): Promise<Todo[]> {
        return this.database.select().from(todos);
    }

    async findById(id: string): Promise<Todo | undefined> {
        return (
            await this.database
                .select()
                .from(todos)
                .where(eq(todos.id, id))
                .limit(1)
        )[0];
    }

    async create(data: Pick<Todo, 'title' | 'description'>): Promise<Todo> {
        return (
            await this.database
                .insert(todos)
                .values({ ...data, description: data.description ?? null })
                .returning()
        )[0];
    }

    async update(
        id: string,
        data: Partial<Pick<Todo, 'title' | 'description' | 'completed'>>,
    ): Promise<Todo | undefined> {
        return (
            await this.database
                .update(todos)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(todos.id, id))
                .returning()
        )[0];
    }

    async delete(id: string): Promise<boolean> {
        return (
            (
                await this.database
                    .delete(todos)
                    .where(eq(todos.id, id))
                    .returning({ id: todos.id })
            ).length > 0
        );
    }
}
