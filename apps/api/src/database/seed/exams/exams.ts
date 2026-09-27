import { primaryCourseId } from '@/database/seed/courses/courses';
import { ExamType, ExamVisibility } from '@/database/schemas/enums.schema';
import type { exams } from '@/database/schemas/exams.schema';

export const aspExamId = '00000000-0000-4000-8000-000000000103';

export type ExamSeed = Omit<typeof exams.$inferInsert, 'createdById'>;

export const examSeeds: ExamSeed[] = [
    {
        id: '00000000-0000-4000-8000-000000000101',
        courseId: primaryCourseId,
        slug: 'prvi-parcijalni-ispit',
        title: 'Prvi parcijalni ispit',
        description: 'Diskretna Matematika',
        type: ExamType.Online,
        durationMinutes: 15,
        maxAttempts: 1,
        visibility: ExamVisibility.Published,
    },
    {
        id: aspExamId,
        courseId: '00000000-0000-4000-8000-000000000003',
        slug: 'asp-online-exam',
        title: 'ASP Online Exam',
        description: 'Algorithms and Data Structures assessment',
        type: ExamType.Online,
        durationMinutes: 90,
        maxAttempts: 1,
        visibility: ExamVisibility.Published,
    },
    {
        id: '00000000-0000-4000-8000-000000000102',
        courseId: primaryCourseId,
        slug: 'drugi-parcijalni-ispit',
        title: 'Drugi parcijalni ispit',
        description: 'Programming exam',
        type: ExamType.Online,
        durationMinutes: 45,
        maxAttempts: 3,
        visibility: ExamVisibility.Published,
    },
];
