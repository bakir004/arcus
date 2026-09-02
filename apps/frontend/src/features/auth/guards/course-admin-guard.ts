import { redirect } from '@tanstack/react-router';
import { checkCourseAdmin } from '@/features/courses/server/check-course-admin';

export async function requireCourseAdmin({ params }: { params: { id: string } }) {
    const access = await checkCourseAdmin({ data: { courseId: params.id } });

    if (!access.authenticated) {
        throw redirect({ to: '/login' });
    }

    if (!access.isAdmin) {
        throw redirect({ to: '/courses/$id', params: { id: params.id } });
    }
}
