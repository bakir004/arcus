import { Outlet, createFileRoute } from '@tanstack/react-router';
import { CourseSectionTabs } from '@/features/courses/components/course-section-tabs';

export const Route = createFileRoute('/courses/$code')({
    component: CourseLayout,
});

function CourseLayout() {
    const { code } = Route.useParams();

    return (
        <>
            <CourseSectionTabs courseCode={code} />
            <main className="px-6 py-6">
                <Outlet />
            </main>
        </>
    );
}
