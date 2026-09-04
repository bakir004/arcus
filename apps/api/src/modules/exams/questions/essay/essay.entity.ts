import { z } from 'zod';
import { QuestionType } from '@/database/schema';

export const essayOptionsSchema = z.object({ type: z.literal(QuestionType.Essay) }).strict();

export type EssayOptions = z.infer<typeof essayOptionsSchema>;
