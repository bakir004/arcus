import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';

@Module({
    imports: [DatabaseModule],
    controllers: [TodosController],
    providers: [TodosRepository, TodosService],
})
export class TodosModule {}
