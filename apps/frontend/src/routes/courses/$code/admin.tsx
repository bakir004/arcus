import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { requireCourseAdmin } from '@/features/auth/guards/course-admin-guard';

export const Route = createFileRoute('/courses/$code/admin')({
    beforeLoad: requireCourseAdmin,
    component: CourseAdminPage,
});

function CourseAdminPage() {
    const { code } = Route.useParams();

    return (
        <main>
            <p>Course admin</p>
            <Button asChild>
                <Link to="/courses/$code" params={{ code }}>
                    Back to course
                </Link>
            </Button>
        </main>
    );
}
