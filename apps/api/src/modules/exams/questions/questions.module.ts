import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { QuestionsController } from '@/modules/exams/questions/questions.controller';
import { QuestionsRepository } from '@/modules/exams/questions/questions.repository';
import { QuestionsService } from '@/modules/exams/questions/questions.service';
import { ExamsModule } from '@/modules/exams/exams/exams.module';

@Module({
    imports: [DatabaseModule, AuthzModule, ExamsModule],
    controllers: [QuestionsController],
    providers: [QuestionsService, QuestionsRepository],
    exports: [QuestionsService, QuestionsRepository],
})
export class QuestionsModule {}
