import { Link, createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/courses/$code/')({ component: CoursePage });

function CoursePage() {
    const { code } = Route.useParams();

    return (
        <main>
            <p>Course</p>
            <div className="mt-4 flex gap-2">
                <Button asChild>
                    <Link to="/courses/$code/materials" params={{ code }}>
                        Course materials
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link to="/courses/$code/admin" params={{ code }}>
                        Course admin
                    </Link>
                </Button>
            </div>
        </main>
    );
}
