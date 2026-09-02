import { z } from 'zod';

export const courseSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(255),
    code: z
        .string()
        .trim()
        .min(1)
        .max(64)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    facultyId: z
        .uuid()
        .nullish()
        .transform((value) => value ?? null),
    createdById: z.string().trim().min(1),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const createCourseSchema = z.object({
    name: z.string().trim().min(1).max(255),
    code: z
        .string()
        .trim()
        .min(1)
        .max(64)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    facultyId: z
        .uuid()
        .nullish()
        .transform((value) => value ?? null),
});

export const updateCourseSchema = createCourseSchema.partial();

export type Course = z.infer<typeof courseSchema>;
export type CourseCreate = z.infer<typeof createCourseSchema>;
export type CourseUpdate = z.infer<typeof updateCourseSchema>;
