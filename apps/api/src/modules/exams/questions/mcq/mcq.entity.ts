import { z } from 'zod';
import { QuestionType } from '@/database/schema';

export const multipleChoiceOptionsBaseSchema = z
    .object({
        type: z.literal(QuestionType.MultipleChoice),
        choices: z.array(z.string().max(512)).min(2).max(20),
        correctIndices: z.array(z.number().int().min(0)).min(1).max(20),
    })
    .strict();

export type MultipleChoiceOptions = z.infer<typeof multipleChoiceOptionsBaseSchema>;

export const multipleChoiceOptionsSchema = multipleChoiceOptionsBaseSchema
    .refine((o) => o.choices.every((c) => c.trim().length > 0) && new Set(o.choices).size === o.choices.length, {
        message: 'choices must be unique and non-blank',
    })
    .refine((o) => o.correctIndices.every((i) => i < o.choices.length), {
        message: 'all correctIndices must be valid indices into choices',
    })
    .refine((o) => new Set(o.correctIndices).size === o.correctIndices.length, {
        message: 'correctIndices must not contain duplicates',
    });
