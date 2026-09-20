import { z } from 'zod';
import { QuestionType } from '@/database/schema';
import { codingAnswerSchema } from '@/modules/exams/answers/coding/coding.entity';
import { essayAnswerSchema } from '@/modules/exams/answers/essay/essay.entity';
import { mcqAnswerSchema } from '@/modules/exams/answers/mcq/mcq.entity';

const scoreStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);
export const answerPayloadSchema = z.discriminatedUnion('type', [
    mcqAnswerSchema,
    codingAnswerSchema,
    essayAnswerSchema,
]);
export type AnswerPayload = z.infer<typeof answerPayloadSchema>;

export const answerSchema = z.object({
    id: z.uuid(),
    attemptId: z.uuid(),
    examItemId: z.uuid(),
    type: z.enum([QuestionType.MultipleChoice, QuestionType.Coding, QuestionType.Essay]),
    answer: answerPayloadSchema,
    score: scoreStringSchema.nullable(),
    feedback: z.string().trim().max(5000).nullable(),
    gradedAt: z.coerce.date().nullable(),
    gradedBy: z.string().trim().min(1).nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const saveAnswerSchema = z.object({ answer: answerPayloadSchema });
export const bulkSaveAnswersSchema = z.object({
    answers: z.array(z.object({ examItemId: z.uuid(), answer: answerPayloadSchema })).max(200),
});
export const gradeAnswerSchema = z.object({
    score: z
        .number()
        .min(0)
        .max(100)
        .refine((value) => Number.isInteger(value * 100)),
    feedback: z.string().trim().min(1).max(5000).optional(),
});

export type Answer = z.infer<typeof answerSchema>;
export type SaveAnswer = z.infer<typeof saveAnswerSchema>;
export type BulkSaveAnswers = z.infer<typeof bulkSaveAnswersSchema>;
export type GradeAnswer = z.infer<typeof gradeAnswerSchema>;
