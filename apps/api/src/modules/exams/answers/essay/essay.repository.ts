// @ts-nocheck
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AnswerPayload } from '@/modules/exams/answers/answer.entity';
import { examEssayAnswers, QuestionType } from '@/database/schema';
import type { AnswerTypeRepository, DbExecutor } from '@/modules/exams/answers/answers.repository.interface';
import { essayAnswerSchema } from '@/modules/exams/answers/essay/essay.entity';

export const essayAnswerRepository: AnswerTypeRepository = {
    type: QuestionType.Essay,
    answerApiSchema: {
        ...z.toJSONSchema(essayAnswerSchema),
        title: 'EssayAnswer',
    },
    validateAnswer(answer: unknown): string | null {
        if (essayAnswerSchema.safeParse(answer).success) return null;
        return 'answer must contain text (string, max 20000 chars)';
    },
    async saveAnswer(db: DbExecutor, answerId: string, answer: AnswerPayload): Promise<void> {
        const payload = answer as { type: QuestionType.Essay; text: string };
        await db.insert(examEssayAnswers).values({ answerId, text: payload.text });
    },
    async clearAnswer(db: DbExecutor, answerId: string): Promise<void> {
        await db.delete(examEssayAnswers).where(sql`${examEssayAnswers.answerId} = ${answerId}::uuid`);
    },
    async loadAnswer(db: DbExecutor, answerId: string): Promise<AnswerPayload> {
        const row = await db.query.examEssayAnswers.findFirst({
            where: (entry, { eq }) => eq(entry.answerId, answerId),
        });
        return { type: QuestionType.Essay, text: row?.text ?? '' };
    },
    async loadAnswersMany(db: DbExecutor, answerIds: string[]): Promise<Map<string, AnswerPayload>> {
        if (answerIds.length === 0) return new Map<string, AnswerPayload>();

        const rows = await db.query.examEssayAnswers.findMany({
            where: (entry, { inArray }) => inArray(entry.answerId, answerIds),
        });

        const rowMap = new Map(rows.map((row) => [row.answerId, row] as const));
        const result = new Map<string, AnswerPayload>();
        for (const answerId of answerIds) {
            result.set(answerId, {
                type: QuestionType.Essay,
                text: rowMap.get(answerId)?.text ?? '',
            });
        }

        return result;
    },
};
