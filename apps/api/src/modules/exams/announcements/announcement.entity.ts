import { z } from 'zod';

export const announcementSchema = z.object({
    id: z.uuid(),
    examId: z.uuid(),
    title: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    message: z.string().trim().min(1).max(1000),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const createAnnouncementSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .nullish()
        .transform((value) => (value == null || value === '' ? null : value)),
    message: z.string().trim().min(1).max(1000),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type Announcement = z.infer<typeof announcementSchema>;
export type AnnouncementCreate = z.infer<typeof createAnnouncementSchema>;
export type AnnouncementUpdate = z.infer<typeof updateAnnouncementSchema>;
