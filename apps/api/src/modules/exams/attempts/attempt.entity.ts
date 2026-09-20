import { z } from 'zod';
import { AttemptStatus, attemptStatusEnum } from '@/database/schema';

const scoreSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

export const attemptStatusSchema: z.ZodType<AttemptStatus> = z
    .enum(attemptStatusEnum.enumValues)
    .transform((value) => value as AttemptStatus);

export const attemptSchema = z.object({
    id: z.uuid(),
    examId: z.uuid(),
    studentId: z.string().trim().min(1).max(255),
    createdById: z.string().trim().min(1),
    status: attemptStatusSchema,
    score: scoreSchema.nullable(),
    startedAt: z.coerce.date().nullable(),
    submittedAt: z.coerce.date().nullable(),
    gradedAt: z.coerce.date().nullable(),
});

export const createAttemptSchema = z.object({});

export const updateAttemptSchema = z
    .object({
        status: attemptStatusSchema.optional(),
        score: scoreSchema.nullable().optional(),
        submittedAt: z.coerce.date().nullable().optional(),
    })
    .refine((value) => value.status !== undefined || value.score !== undefined || value.submittedAt !== undefined, {
        message: 'at least one field must be provided for update',
    });

export type Attempt = z.infer<typeof attemptSchema>;
export type AttemptCreate = z.infer<typeof createAttemptSchema>;
export type AttemptUpdate = z.infer<typeof updateAttemptSchema>;
