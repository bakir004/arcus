// @ts-nocheck
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AnswerPayload } from '@/modules/exams/answers/answer.entity';
import { examCodingAnswers, QuestionType } from '@/database/schema';
import type { AnswerTypeRepository, DbExecutor } from '@/modules/exams/answers/answers.repository.interface';
import { codingAnswerSchema } from '@/modules/exams/answers/coding/coding.entity';

export const codingAnswerRepository: AnswerTypeRepository = {
    type: QuestionType.Coding,
    answerApiSchema: {
        ...z.toJSONSchema(codingAnswerSchema),
        title: 'CodingAnswer',
    },
    validateAnswer(answer: unknown): string | null {
        if (codingAnswerSchema.safeParse(answer).success) return null;
        return 'answer must contain code (string, 1..50000 chars) and language (cpp or javascript)';
    },
    async saveAnswer(db: DbExecutor, answerId: string, answer: AnswerPayload): Promise<void> {
        const payload = answer as Extract<AnswerPayload, { type: QuestionType.Coding }>;
        await db.insert(examCodingAnswers).values({
            answerId,
            code: payload.code,
            language: payload.language,
        });
    },
    async clearAnswer(db: DbExecutor, answerId: string): Promise<void> {
        await db.delete(examCodingAnswers).where(sql`${examCodingAnswers.answerId} = ${answerId}::uuid`);
    },
    async loadAnswer(db: DbExecutor, answerId: string): Promise<AnswerPayload> {
        const row = await db.query.examCodingAnswers.findFirst({
            where: (entry, { eq }) => eq(entry.answerId, answerId),
        });
        return {
            type: QuestionType.Coding,
            code: row?.code ?? '',
            language: row?.language ?? '',
        };
    },
    async loadAnswersMany(db: DbExecutor, answerIds: string[]): Promise<Map<string, AnswerPayload>> {
        if (answerIds.length === 0) return new Map<string, AnswerPayload>();

        const rows = await db.query.examCodingAnswers.findMany({
            where: (entry, { inArray }) => inArray(entry.answerId, answerIds),
        });

        const rowMap = new Map(rows.map((row) => [row.answerId, row] as const));
        const result = new Map<string, AnswerPayload>();
        for (const answerId of answerIds) {
            const row = rowMap.get(answerId);
            result.set(answerId, {
                type: QuestionType.Coding,
                code: row?.code ?? '',
                language: row?.language ?? '',
            });
        }

        return result;
    },
};
