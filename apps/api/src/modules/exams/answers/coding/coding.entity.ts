import { z } from 'zod';
import { CodingLanguage, QuestionType } from '@/database/schema';

export const codingAnswerSchema = z.object({
    type: z.literal(QuestionType.Coding),
    code: z.string().min(1).max(50000),
    language: z.enum([
        CodingLanguage.Cpp,
        CodingLanguage.Java,
        CodingLanguage.JavaScript,
        CodingLanguage.Python,
        CodingLanguage.Sql,
    ]),
});
