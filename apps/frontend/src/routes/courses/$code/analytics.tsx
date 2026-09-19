import { createFileRoute } from '@tanstack/react-router';
import { CoursePlaceholderPage } from '@/features/courses/components/course-placeholder-page';

export const Route = createFileRoute('/courses/$code/analytics')({
    component: () => <CoursePlaceholderPage title="Analytics" />,
});
