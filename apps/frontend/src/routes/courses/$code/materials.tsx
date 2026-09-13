import { createFileRoute } from '@tanstack/react-router';
import { CourseMaterialsPage } from '@/features/courses/components/course-materials-page';

export const Route = createFileRoute('/courses/$code/materials')({ component: CourseMaterialsPage });
