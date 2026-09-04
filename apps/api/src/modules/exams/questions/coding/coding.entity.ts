import { z } from 'zod';
import { CodingLanguage, QuestionType } from '@/database/schema';

export const codingOptionsSchema = z
    .object({
        type: z.literal(QuestionType.Coding),
        language: z.enum([
            CodingLanguage.Cpp,
            CodingLanguage.Java,
            CodingLanguage.JavaScript,
            CodingLanguage.Python,
            CodingLanguage.Sql,
        ]),
        mode: z.string().max(64).optional(),
        initialCode: z.string().max(20_000).optional(),
        solutionCode: z.string().max(20_000).optional(),
        studentCodeTemplate: z.string().max(20_000).optional(),
        testCodeTemplate: z.string().max(20_000).optional(),
        testCases: z
            .array(
                z
                    .object({
                        id: z.string().max(128).optional(),
                        name: z.string().max(256).optional(),
                        input: z.string().max(4000).optional(),
                        expectedOutput: z.string().max(4000).optional(),
                        code: z.string().max(20_000).optional(),
                    })
                    .strict(),
            )
            .max(50)
            .optional(),
    })
    .strict();

export type CodingOptions = z.infer<typeof codingOptionsSchema>;
