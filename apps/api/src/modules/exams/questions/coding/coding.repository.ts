// @ts-nocheck
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { CodingOptions } from '@/modules/exams/questions/coding/coding.entity';
import type { QuestionOptions } from '@/modules/exams/questions/questions.entity';
import {
    CodingLanguage,
    examQuestionCodingConfigs,
    examQuestionCodingTestCases,
    QuestionType,
} from '@/database/schema';
import { codingOptionsSchema } from '@/modules/exams/questions/coding/coding.entity';
import type { DbExecutor, QuestionTypeRepository } from '@/modules/exams/questions/questions.repository.interface';

export const codingRepository: QuestionTypeRepository = {
    type: QuestionType.Coding,
    optionsApiSchema: {
        ...z.toJSONSchema(codingOptionsSchema),
        title: 'CodingOptions',
    },
    validateOptions(options: unknown): string | null {
        if (codingOptionsSchema.safeParse(options).success) return null;
        return 'options must include language (cpp or javascript) and may include exec-worker fields: mode, initialCode, solutionCode, and testCases';
    },
    async saveOptions(db: DbExecutor, questionId: string, options: QuestionOptions): Promise<void> {
        const o = options as CodingOptions;
        await db.insert(examQuestionCodingConfigs).values({
            questionId,
            language: o.language,
            mode: o.mode ?? null,
            initialCode: o.initialCode ?? null,
            solutionCode: o.solutionCode ?? null,
            studentCodeTemplate: o.studentCodeTemplate ?? null,
            testCodeTemplate: o.testCodeTemplate ?? null,
        });
        if (o.testCases && o.testCases.length > 0) {
            await db.insert(examQuestionCodingTestCases).values(
                o.testCases.map((tc, index) => ({
                    questionId,
                    input: tc.input ?? '',
                    expectedOutput: tc.expectedOutput ?? '',
                    name: tc.name ?? null,
                    code: tc.code ?? null,
                    position: index,
                })),
            );
        }
    },
    async clearOptions(db: DbExecutor, questionId: string): Promise<void> {
        await db.delete(examQuestionCodingTestCases).where(eq(examQuestionCodingTestCases.questionId, questionId));
        await db.delete(examQuestionCodingConfigs).where(eq(examQuestionCodingConfigs.questionId, questionId));
    },
    async loadOptions(db: DbExecutor, questionId: string): Promise<QuestionOptions> {
        const config = await db.query.examQuestionCodingConfigs.findFirst({
            where: (entry, { eq }) => eq(entry.questionId, questionId),
        });
        const rows = await db.query.examQuestionCodingTestCases.findMany({
            where: (tc, { eq }) => eq(tc.questionId, questionId),
            orderBy: (tc, { asc }) => asc(tc.position),
        });
        return {
            type: QuestionType.Coding,
            language: config?.language ?? CodingLanguage.JavaScript,
            ...(config?.mode ? { mode: config.mode } : {}),
            ...(config?.initialCode ? { initialCode: config.initialCode } : {}),
            ...(config?.solutionCode ? { solutionCode: config.solutionCode } : {}),
            ...(config?.studentCodeTemplate ? { studentCodeTemplate: config.studentCodeTemplate } : {}),
            ...(config?.testCodeTemplate ? { testCodeTemplate: config.testCodeTemplate } : {}),
            testCases: rows.map((row) => ({
                input: row.input,
                expectedOutput: row.expectedOutput,
                ...(row.name ? { name: row.name } : {}),
                ...(row.code ? { code: row.code } : {}),
            })),
        };
    },
    async loadOptionsMany(db: DbExecutor, questionIds: string[]): Promise<Map<string, QuestionOptions>> {
        if (questionIds.length === 0) return new Map<string, QuestionOptions>();

        const [configs, testCases] = await Promise.all([
            db.query.examQuestionCodingConfigs.findMany({
                where: (entry, { inArray }) => inArray(entry.questionId, questionIds),
            }),
            db.query.examQuestionCodingTestCases.findMany({
                where: (entry, { inArray }) => inArray(entry.questionId, questionIds),
                orderBy: (entry, { asc }) => [asc(entry.questionId), asc(entry.position)],
            }),
        ]);

        const configMap = new Map(configs.map((entry) => [entry.questionId, entry] as const));
        const testCaseMap = new Map<string, NonNullable<CodingOptions['testCases']>>();
        for (const testCase of testCases) {
            const entries = testCaseMap.get(testCase.questionId) ?? [];
            entries.push({
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                ...(testCase.name ? { name: testCase.name } : {}),
                ...(testCase.code ? { code: testCase.code } : {}),
            });
            testCaseMap.set(testCase.questionId, entries);
        }

        const result = new Map<string, QuestionOptions>();
        for (const questionId of questionIds) {
            const config = configMap.get(questionId);
            result.set(questionId, {
                type: QuestionType.Coding,
                language: config?.language ?? CodingLanguage.JavaScript,
                ...(config?.mode ? { mode: config.mode } : {}),
                ...(config?.initialCode ? { initialCode: config.initialCode } : {}),
                ...(config?.solutionCode ? { solutionCode: config.solutionCode } : {}),
                ...(config?.studentCodeTemplate ? { studentCodeTemplate: config.studentCodeTemplate } : {}),
                ...(config?.testCodeTemplate ? { testCodeTemplate: config.testCodeTemplate } : {}),
                testCases: testCaseMap.get(questionId) ?? [],
            });
        }

        return result;
    },
};
