import { BadRequestException, Injectable } from '@nestjs/common';
import { QuestionType } from '@/database/schema';
import { CreateQuestionDto, ReorderQuestionsDto, UpdateQuestionDto } from '@/modules/exams/questions/questions.dto';
import type { Question } from '@/modules/exams/questions/questions.entity';
import { createQuestionSchema, updateQuestionSchema } from '@/modules/exams/questions/questions.entity';
import { QuestionsRepository } from '@/modules/exams/questions/questions.repository';
import { getQuestionRepository } from '@/modules/exams/questions/questions.repository.registry';

@Injectable()
export class QuestionsService {
    constructor(private readonly questionsRepository: QuestionsRepository) {}

    async listItems(examId: string) {
        return this.questionsRepository.listItems(await this.questionsRepository.resolveExamId(examId));
    }

    async createItem(examId: string, dto: import('./exam-items.dto').CreateExamItemDto) {
        return this.questionsRepository.createItem(await this.questionsRepository.resolveExamId(examId), dto);
    }

    async updateItem(examId: string, id: string, dto: import('./exam-items.dto').UpdateExamItemDto) {
        return this.questionsRepository.updateItem(await this.questionsRepository.resolveExamId(examId), id, dto);
    }

    async deleteItem(examId: string, id: string) {
        return this.questionsRepository.deleteItem(await this.questionsRepository.resolveExamId(examId), id);
    }

    async create(examId: string, dto: CreateQuestionDto) {
        examId = await this.questionsRepository.resolveExamId(examId);
        await this.ensureQuestionMutationAllowed(examId);
        const data = createQuestionSchema.parse(dto);
        const optionsError = getQuestionRepository(data.options.type).validateOptions(data.options);
        if (optionsError) throw new BadRequestException(optionsError);
        return this.questionsRepository.create(examId, data);
    }

    async findAllForAuthoring(examId: string) {
        examId = await this.questionsRepository.resolveExamId(examId);
        return this.questionsRepository.findAllByExam(examId);
    }

    async findAll(examId: string) {
        examId = await this.questionsRepository.resolveExamId(examId);
        return this.questionsRepository
            .findAllByExam(examId)
            .then((questions) => questions.map((question) => this.sanitizeForPublicRead(question)));
    }

    async findById(examId: string, id: string) {
        examId = await this.questionsRepository.resolveExamId(examId);
        return this.questionsRepository.findById(examId, id).then((question) => this.sanitizeForPublicRead(question));
    }

    async update(examId: string, id: string, dto: UpdateQuestionDto) {
        examId = await this.questionsRepository.resolveExamId(examId);
        await this.ensureQuestionMutationAllowed(examId);
        const data = updateQuestionSchema.parse(dto);
        if (data.options) {
            const optionsError = getQuestionRepository(data.options.type).validateOptions(data.options);
            if (optionsError) throw new BadRequestException(optionsError);
        }
        return this.questionsRepository.update(examId, id, data);
    }

    async reorder(examId: string, dto: ReorderQuestionsDto) {
        examId = await this.questionsRepository.resolveExamId(examId);
        await this.ensureQuestionMutationAllowed(examId);
        return this.questionsRepository.reorder(examId, dto.questionIds);
    }

    async delete(examId: string, id: string) {
        examId = await this.questionsRepository.resolveExamId(examId);
        await this.ensureQuestionMutationAllowed(examId);
        return this.questionsRepository.delete(examId, id);
    }

    private async ensureQuestionMutationAllowed(examId: string): Promise<void> {
        await this.questionsRepository.ensureExamExists(examId);
        const hasAttempts = await this.questionsRepository.hasAttempts(examId);
        if (hasAttempts) {
            throw new BadRequestException('questions cannot be modified after attempts have started');
        }
    }

    private sanitizeForPublicRead(question: Question): Question {
        if (question.options.type !== QuestionType.MultipleChoice) return question;

        return {
            ...question,
            options: {
                type: question.options.type,
                choices: question.options.choices,
                multipleAnswers: question.options.correctIndices.length > 1,
                // redact correct indices
                correctIndices: [],
            },
        } as unknown as Question;
    }
}
