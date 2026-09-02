import { redirect } from '@tanstack/react-router';
import { checkCourseAdmin } from '@/features/courses/server/check-course-admin';

export async function requireCourseAdmin({ params }: { params: { code: string } }) {
    const access = await checkCourseAdmin({ data: { courseCode: params.code } });

    if (!access.authenticated) {
        throw redirect({ to: '/login' });
    }

    if (!access.isAdmin) {
        throw redirect({ to: '/courses/$code', params: { code: params.code } });
    }
}
