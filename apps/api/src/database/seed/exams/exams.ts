import { primaryCourseId } from '@/database/seed/courses/courses';
import { ExamType, ExamVisibility } from '@/database/schemas/enums.schema';
import type { exams } from '@/database/schemas/exams.schema';

export type ExamSeed = Omit<typeof exams.$inferInsert, 'createdById'>;

export const examSeeds: ExamSeed[] = [
    {
        id: '00000000-0000-4000-8000-000000000101',
        courseId: primaryCourseId,
        title: 'Prvi parcijalni ispit',
        description: 'Diskretna Matematika',
        type: ExamType.Online,
        durationMinutes: 15,
        maxAttempts: 1,
        visibility: ExamVisibility.Published,
    },
    {
        id: '00000000-0000-4000-8000-000000000102',
        courseId: primaryCourseId,
        title: 'Drugi parcijalni ispit',
        description: 'Programming exam',
        type: ExamType.Online,
        durationMinutes: 45,
        maxAttempts: 3,
        visibility: ExamVisibility.Published,
    },
];
