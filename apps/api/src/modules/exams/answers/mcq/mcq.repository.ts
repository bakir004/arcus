// @ts-nocheck
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AnswerPayload } from '@/modules/exams/answers/answer.entity';
import { examMultipleChoiceAnswerSelections, QuestionType } from '@/database/schema';
import type { AnswerTypeRepository, DbExecutor } from '@/modules/exams/answers/answers.repository.interface';
import { mcqAnswerSchema } from '@/modules/exams/answers/mcq/mcq.entity';

export const mcqAnswerRepository: AnswerTypeRepository = {
    type: QuestionType.MultipleChoice,
    answerApiSchema: {
        ...z.toJSONSchema(mcqAnswerSchema),
        title: 'MultipleChoiceAnswer',
    },
    validateAnswer(answer: unknown): string | null {
        if (mcqAnswerSchema.safeParse(answer).success) return null;
        return 'answer must contain selectedIndices (number[], all >= 0, max 20 items)';
    },
    async saveAnswer(db: DbExecutor, answerId: string, answer: AnswerPayload): Promise<void> {
        const payload = answer as Extract<AnswerPayload, { type: QuestionType.MultipleChoice }>;
        if (payload.selectedIndices.length > 0) {
            await db.insert(examMultipleChoiceAnswerSelections).values(
                payload.selectedIndices.map((selectedIndex) => ({
                    answerId,
                    selectedIndex,
                })),
            );
        }
    },
    async clearAnswer(db: DbExecutor, answerId: string): Promise<void> {
        await db
            .delete(examMultipleChoiceAnswerSelections)
            .where(sql`${examMultipleChoiceAnswerSelections.answerId} = ${answerId}::uuid`);
    },
    async loadAnswer(db: DbExecutor, answerId: string): Promise<AnswerPayload> {
        const selections = await db.query.examMultipleChoiceAnswerSelections.findMany({
            where: (entry, { eq }) => eq(entry.answerId, answerId),
            orderBy: (entry, { asc }) => asc(entry.selectedIndex),
        });
        return {
            type: QuestionType.MultipleChoice,
            selectedIndices: selections.map((entry) => entry.selectedIndex),
        };
    },
    async loadAnswersMany(db: DbExecutor, answerIds: string[]): Promise<Map<string, AnswerPayload>> {
        if (answerIds.length === 0) return new Map<string, AnswerPayload>();

        const rows = await db.query.examMultipleChoiceAnswerSelections.findMany({
            where: (entry, { inArray }) => inArray(entry.answerId, answerIds),
            orderBy: (entry, { asc }) => [asc(entry.answerId), asc(entry.selectedIndex)],
        });

        const selectionsByAnswerId = new Map<string, number[]>();
        for (const row of rows) {
            const selections = selectionsByAnswerId.get(row.answerId) ?? [];
            selections.push(row.selectedIndex);
            selectionsByAnswerId.set(row.answerId, selections);
        }

        const result = new Map<string, AnswerPayload>();
        for (const answerId of answerIds) {
            result.set(answerId, {
                type: QuestionType.MultipleChoice,
                selectedIndices: selectionsByAnswerId.get(answerId) ?? [],
            });
        }

        return result;
    },
};
