import { BadRequestException, Injectable } from '@nestjs/common';
import { BulkSaveAnswersDto, GradeAnswerDto, SaveAnswerDto } from '@/modules/exams/answers/answers.dto';
import { bulkSaveAnswersSchema, gradeAnswerSchema, saveAnswerSchema } from '@/modules/exams/answers/answer.entity';
import { AnswersRepository } from '@/modules/exams/answers/answers.repository';
import { getAnswerRepository } from '@/modules/exams/answers/answers.repository.registry';
import { QuestionsRepository } from '@/modules/exams/questions/questions.repository';

@Injectable()
export class AnswersService {
    constructor(
        private readonly answersRepository: AnswersRepository,
        private readonly questionsRepository: QuestionsRepository,
    ) {}

    async saveAnswer(examId: string, attemptId: string, examItemId: string, studentId: string, dto: SaveAnswerDto) {
        const result = saveAnswerSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);
        const attempt = await this.answersRepository.findAttempt(examId, attemptId);
        if (attempt.studentId !== studentId) throw new BadRequestException('attempt does not belong to user');
        if (attempt.status !== 'in_progress')
            throw new BadRequestException('answers can only be saved for in-progress attempts');
        const question = await this.questionsRepository.findByItemId(examId, examItemId);
        if (result.data.answer.type !== question.options.type)
            throw new BadRequestException('answer type must match question type');
        const error = getAnswerRepository(result.data.answer.type).validateAnswer(result.data.answer);
        if (error) throw new BadRequestException(error);
        return this.answersRepository.upsert(attemptId, question.examItemId, result.data.answer);
    }

    async bulkSaveAnswers(examId: string, attemptId: string, studentId: string, dto: BulkSaveAnswersDto) {
        const result = bulkSaveAnswersSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);
        if (result.data.answers.length === 0) return [];
        const ids = result.data.answers.map((item) => item.examItemId);
        if (new Set(ids).size !== ids.length)
            throw new BadRequestException('duplicate examItemId entries are not allowed in bulk save');
        await this.answersRepository.findAttempt(examId, attemptId);
        return Promise.all(
            result.data.answers.map((item) =>
                this.saveAnswer(examId, attemptId, item.examItemId, studentId, { answer: item.answer }),
            ),
        );
    }

    async getOwnAnswers(examId: string, attemptId: string, studentId: string) {
        const attempt = await this.answersRepository.findAttempt(examId, attemptId);
        if (attempt.studentId !== studentId) throw new BadRequestException('attempt does not belong to user');
        return this.answersRepository.findAllByAttempt(attemptId);
    }

    async gradeAnswer(examId: string, attemptId: string, examItemId: string, graderId: string, dto: GradeAnswerDto) {
        const result = gradeAnswerSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);
        await this.answersRepository.findAttempt(examId, attemptId);
        await this.questionsRepository.ensureItemExists(examId, examItemId);
        return this.answersRepository.grade(attemptId, examItemId, result.data, graderId);
    }

    async getExamAnswerTable(examId: string) {
        await this.questionsRepository.ensureExamExists(examId);
        return this.answersRepository.getExamAnswerTable(examId);
    }
}
