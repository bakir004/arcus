import { createFileRoute } from '@tanstack/react-router';
import { CourseExamsPage } from '@/features/courses/exams/pages/course-exams-page';
import { courseByCodeOptions } from '@/features/courses/api/get-course';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/courses/$code/exams')({
    loader: ({ params }) => queryClient.ensureQueryData(courseByCodeOptions(params.code)),
    component: function CourseExamsRoute() {
        const course = Route.useLoaderData();
        return <CourseExamsPage courseId={course.id} courseCode={Route.useParams().code} />;
    },
});
