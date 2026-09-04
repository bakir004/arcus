// @ts-nocheck
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { QuestionOptions } from '@/modules/exams/questions/questions.entity';
import { examQuestionEssayConfigs, QuestionType } from '@/database/schema';
import { essayOptionsSchema } from '@/modules/exams/questions/essay/essay.entity';
import type { DbExecutor, QuestionTypeRepository } from '@/modules/exams/questions/questions.repository.interface';

export const essayRepository: QuestionTypeRepository = {
    type: QuestionType.Essay,
    optionsApiSchema: {
        ...z.toJSONSchema(essayOptionsSchema),
        title: 'EssayOptions',
    },
    validateOptions(options: unknown): string | null {
        if (essayOptionsSchema.safeParse(options).success) return null;
        return 'essay questions must not include choices or testCases in options';
    },
    async saveOptions(db: DbExecutor, questionId: string, _options: QuestionOptions): Promise<void> {
        await db.insert(examQuestionEssayConfigs).values({ questionId });
    },
    async clearOptions(db: DbExecutor, questionId: string): Promise<void> {
        await db.delete(examQuestionEssayConfigs).where(eq(examQuestionEssayConfigs.questionId, questionId));
    },
    loadOptions(_db: DbExecutor, _questionId: string): Promise<QuestionOptions> {
        return Promise.resolve({ type: QuestionType.Essay });
    },
    loadOptionsMany(_db: DbExecutor, questionIds: string[]): Promise<Map<string, QuestionOptions>> {
        const result = new Map<string, QuestionOptions>();
        for (const questionId of questionIds) {
            result.set(questionId, { type: QuestionType.Essay });
        }
        return Promise.resolve(result);
    },
};
