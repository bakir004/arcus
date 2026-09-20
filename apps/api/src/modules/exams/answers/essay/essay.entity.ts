import { z } from 'zod';
import { QuestionType } from '@/database/schema';

export const essayAnswerSchema = z.object({
    type: z.literal(QuestionType.Essay),
    text: z.string().max(20000),
});
