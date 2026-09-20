import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { QuestionsModule } from '@/modules/exams/questions/questions.module';
import { AnswersController } from '@/modules/exams/answers/answers.controller';
import { ExamAnswersController } from '@/modules/exams/answers/exam-answers.controller';
import { AnswersRepository } from '@/modules/exams/answers/answers.repository';
import { AnswersService } from '@/modules/exams/answers/answers.service';

@Module({
    imports: [DatabaseModule, AuthzModule, QuestionsModule],
    controllers: [AnswersController, ExamAnswersController],
    providers: [AnswersRepository, AnswersService],
    exports: [AnswersRepository, AnswersService],
})
export class AnswersModule {}
