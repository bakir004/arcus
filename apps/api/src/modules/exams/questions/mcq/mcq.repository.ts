// @ts-nocheck
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { MultipleChoiceOptions } from '@/modules/exams/questions/mcq/mcq.entity';
import type { QuestionOptions } from '@/modules/exams/questions/questions.entity';
import { examQuestionMultipleChoiceChoices, QuestionType } from '@/database/schema';
import { multipleChoiceOptionsBaseSchema, multipleChoiceOptionsSchema } from '@/modules/exams/questions/mcq/mcq.entity';
import type { DbExecutor, QuestionTypeRepository } from '@/modules/exams/questions/questions.repository.interface';

export const multipleChoiceRepository: QuestionTypeRepository = {
    type: QuestionType.MultipleChoice,
    optionsApiSchema: {
        ...z.toJSONSchema(multipleChoiceOptionsBaseSchema),
        title: 'MultipleChoiceOptions',
        example: {
            type: QuestionType.MultipleChoice,
            choices: ['2', '3', '4', '5'],
            correctIndices: [0, 1, 3],
        },
    },
    validateOptions(options: unknown): string | null {
        if (multipleChoiceOptionsSchema.safeParse(options).success) return null;
        return 'options must contain choices (non-empty unique strings, min 2) and correctIndices (number[], min 1, all valid indices into choices)';
    },
    async saveOptions(db: DbExecutor, questionId: string, options: QuestionOptions): Promise<void> {
        const o = options as MultipleChoiceOptions;
        const correctIndices = new Set(o.correctIndices);
        await db.insert(examQuestionMultipleChoiceChoices).values(
            o.choices.map((choice, index) => ({
                questionId,
                choiceText: choice,
                position: index,
                isCorrect: correctIndices.has(index),
            })),
        );
    },
    async clearOptions(db: DbExecutor, questionId: string): Promise<void> {
        await db
            .delete(examQuestionMultipleChoiceChoices)
            .where(eq(examQuestionMultipleChoiceChoices.questionId, questionId));
    },
    async loadOptions(db: DbExecutor, questionId: string): Promise<QuestionOptions> {
        const rows = await db.query.examQuestionMultipleChoiceChoices.findMany({
            where: (choice, { eq }) => eq(choice.questionId, questionId),
            orderBy: (choice, { asc }) => asc(choice.position),
        });
        return {
            type: QuestionType.MultipleChoice,
            choices: rows.map((row) => row.choiceText),
            correctIndices: rows.filter((row) => row.isCorrect).map((row) => row.position),
        };
    },
    async loadOptionsMany(db: DbExecutor, questionIds: string[]): Promise<Map<string, QuestionOptions>> {
        if (questionIds.length === 0) return new Map<string, QuestionOptions>();

        const rows = await db.query.examQuestionMultipleChoiceChoices.findMany({
            where: (choice, { inArray }) => inArray(choice.questionId, questionIds),
            orderBy: (choice, { asc }) => [asc(choice.questionId), asc(choice.position)],
        });

        const grouped = new Map<string, { choices: string[]; correctIndices: number[] }>();
        for (const row of rows) {
            const entry = grouped.get(row.questionId) ?? {
                choices: [],
                correctIndices: [],
            };
            entry.choices.push(row.choiceText);
            if (row.isCorrect) entry.correctIndices.push(row.position);
            grouped.set(row.questionId, entry);
        }

        const result = new Map<string, QuestionOptions>();
        for (const questionId of questionIds) {
            const entry = grouped.get(questionId);
            if (!entry) continue;
            result.set(questionId, {
                type: QuestionType.MultipleChoice,
                choices: entry.choices,
                correctIndices: entry.correctIndices,
            });
        }

        return result;
    },
};
