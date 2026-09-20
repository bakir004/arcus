import { z } from 'zod';
import { QuestionType } from '@/database/schema';

export const mcqAnswerSchema = z.object({
    type: z.literal(QuestionType.MultipleChoice),
    selectedIndices: z
        .array(z.number().min(0))
        .max(20)
        .refine((arr) => new Set(arr).size === arr.length, {
            message: 'selectedIndices must not contain duplicates',
        }),
});
