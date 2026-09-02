import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/courses/$id/')({ component: CoursePage });

function CoursePage() {
    const { id } = Route.useParams();

    return (
        <main>
            <p>Course</p>
            <Button asChild>
                <Link to="/courses/$id/admin" params={{ id }}>
                    Course admin
                </Link>
            </Button>
        </main>
    );
}
