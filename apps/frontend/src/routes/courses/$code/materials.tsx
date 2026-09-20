import { createFileRoute } from '@tanstack/react-router';
import { CourseMaterialsPage } from '@/features/courses/materials/pages/course-materials-page';
import { courseMeOptions } from '@/features/courses/api/get-course-me';
import { courseMaterialsOptions } from '@/features/courses/materials/api/get-course-materials';
import { courseByCodeOptions } from '@/features/courses/api/get-course';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/courses/$code/materials')({
    loader: async ({ params }) => {
        const course = await queryClient.query(courseByCodeOptions(params.code));

        await Promise.all([
            queryClient.query(courseMaterialsOptions(course.id)).catch(() => undefined),
            queryClient.query(courseMeOptions(course.id)).catch(() => undefined),
        ]);
    },
    component: CourseMaterialsPage,
});
