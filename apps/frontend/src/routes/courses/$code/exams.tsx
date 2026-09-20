import { createFileRoute } from '@tanstack/react-router';
import { CourseExamsPage } from '@/features/courses/exams/pages/course-exams-page';

export const Route = createFileRoute('/courses/$code/exams')({
    component: CourseExamsPage,
});
