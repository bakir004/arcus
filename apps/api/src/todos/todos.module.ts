import { Module } from '@nestjs/common';
import { TodosController } from '@/todos/todos.controller';
import { TodosRepository } from '@/todos/todos.repository';
import { TodosService } from '@/todos/todos.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TodosController],
    providers: [TodosRepository, TodosService],
})
export class TodosModule {}
