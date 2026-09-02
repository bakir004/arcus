import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/courses/$code/')({ component: CoursePage });

function CoursePage() {
    const { code } = Route.useParams();

    return (
        <main>
            <p>Course</p>
            <Button asChild>
                <Link to="/courses/$code/admin" params={{ code }}>
                    Course admin
                </Link>
            </Button>
        </main>
    );
}
