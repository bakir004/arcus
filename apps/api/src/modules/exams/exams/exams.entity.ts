import { z } from 'zod';
import { ExamType, ExamVisibility, examTypeEnum, examVisibilityEnum } from '@/database/schema';

export const examTypeSchema: z.ZodType<ExamType> = z
    .enum(examTypeEnum.enumValues)
    .transform((value) => value as ExamType);

export const examVisibilitySchema: z.ZodType<ExamVisibility> = z
    .enum(examVisibilityEnum.enumValues)
    .transform((value) => value as ExamVisibility);

export const examSchema = z.object({
    id: z.uuid(),
    courseId: z.uuid(),
    createdById: z.string().trim().min(1),
    slug: z.string().trim().min(1).max(255),
    title: z.string().trim().min(1).max(255),
    description: z
        .string()
        .trim()
        .max(5000)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    durationMinutes: z
        .number()
        .int()
        .min(1)
        .max(24 * 60),
    maxAttempts: z.number().int().min(1).max(20),
    type: examTypeSchema,
    visibility: examVisibilitySchema,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const createExamSchema = z.object({
    slug: z.string().trim().min(1).max(255),
    title: z.string().trim().min(1).max(255),
    description: z
        .string()
        .trim()
        .max(5000)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    durationMinutes: z
        .number()
        .int()
        .min(1)
        .max(24 * 60),
    maxAttempts: z.number().int().min(1).max(20),
    type: examTypeSchema,
    visibility: examVisibilitySchema,
});

export const updateExamSchema = createExamSchema.partial();

export type Exam = z.infer<typeof examSchema>;
export type ExamCreate = z.infer<typeof createExamSchema>;
export type ExamUpdate = z.infer<typeof updateExamSchema>;
