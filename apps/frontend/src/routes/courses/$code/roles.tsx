import { createFileRoute } from '@tanstack/react-router';
import { CourseRolesPage } from '@/features/courses/components/course-roles-page';
import { courseByCodeOptions } from '@/features/courses/api/get-course';
import {
    courseMembersOptions,
    coursePermissionsOptions,
    courseRolesOptions,
} from '@/features/courses/api/get-course-roles';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/courses/$code/roles')({
    loader: async ({ params }) => {
        const course = await queryClient.query(courseByCodeOptions(params.code));

        await Promise.all([
            queryClient.query(courseRolesOptions(course.id)).catch(() => undefined),
            queryClient.query(coursePermissionsOptions(course.id)).catch(() => undefined),
            queryClient.query(courseMembersOptions(course.id)).catch(() => undefined),
        ]);
    },
    component: CourseRolesRoute,
});

function CourseRolesRoute() {
    const { code } = Route.useParams();
    return <CourseRolesPage courseCode={code} />;
}
