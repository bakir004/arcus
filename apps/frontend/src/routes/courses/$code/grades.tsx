import { createFileRoute } from '@tanstack/react-router';
import { courseByCodeOptions } from '@/features/courses/api/get-course';
import { CourseGradesPage } from '@/features/courses/grades/pages/course-grades-page';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/courses/$code/grades')({
    loader: ({ params }) => queryClient.ensureQueryData(courseByCodeOptions(params.code)),
    component: CourseGradesPage,
});
