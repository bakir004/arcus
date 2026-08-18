import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { TodosModule } from './modules/todos/todos.module';

@Module({
    imports: [DatabaseModule, TodosModule],
})
export class AppModule {}
