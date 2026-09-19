import { createFileRoute } from '@tanstack/react-router';
import { CourseRolesPage } from '@/features/courses/components/course-roles-page';

export const Route = createFileRoute('/courses/$code/roles')({
    component: CourseRolesRoute,
});

function CourseRolesRoute() {
    const { code } = Route.useParams();
    return <CourseRolesPage courseCode={code} />;
}
