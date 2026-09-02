import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { requireCourseAdmin } from '@/features/auth/guards/course-admin-guard';

export const Route = createFileRoute('/courses/$id/admin')({
    beforeLoad: requireCourseAdmin,
    component: CourseAdminPage,
});

function CourseAdminPage() {
    const { id } = Route.useParams();

    return (
        <main>
            <p>Course admin</p>
            <Button asChild>
                <Link to="/courses/$id" params={{ id }}>
                    Back to course
                </Link>
            </Button>
        </main>
    );
}
