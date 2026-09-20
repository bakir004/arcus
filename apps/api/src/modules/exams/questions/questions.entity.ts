import { z } from 'zod';
import { codingOptionsSchema } from '@/modules/exams/questions/coding/coding.entity';
import { essayOptionsSchema } from '@/modules/exams/questions/essay/essay.entity';
import { multipleChoiceOptionsSchema } from '@/modules/exams/questions/mcq/mcq.entity';

const pointsStringSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'points must be a decimal string with up to 2 decimal places')
    .refine((value) => Number(value) >= 0.01 && Number(value) <= 100, {
        message: 'points must be between 0.01 and 100',
    });

export const questionOptionsSchema = z.discriminatedUnion('type', [
    multipleChoiceOptionsSchema,
    codingOptionsSchema,
    essayOptionsSchema,
]);

export type QuestionOptions = z.infer<typeof questionOptionsSchema>;

export const questionSchema = z.object({
    id: z.uuid(),
    examItemId: z.uuid(),
    examId: z.uuid(),
    prompt: z.string().trim().min(1).max(4000),
    position: z.number().int().min(1),
    points: pointsStringSchema,
    options: questionOptionsSchema,
    createdAt: z.coerce.date(),
});

export const createQuestionSchema = z.object({
    prompt: z.string().trim().min(1).max(4000),
    position: z.number().int().min(1),
    points: z
        .number()
        .min(0.01)
        .max(100)
        .refine((value) => Number.isInteger(value * 100), {
            message: 'points must have at most 2 decimal places (e.g. 1.25)',
        }),
    options: questionOptionsSchema,
});

export const updateQuestionSchema = createQuestionSchema.partial();

export type Question = z.infer<typeof questionSchema>;
export type QuestionCreate = z.infer<typeof createQuestionSchema>;
export type QuestionUpdate = z.infer<typeof updateQuestionSchema>;
