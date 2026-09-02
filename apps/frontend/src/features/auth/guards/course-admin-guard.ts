import { redirect } from '@tanstack/react-router';
import { queryClient } from '@/lib/query-client';
import { courseAdminAccessOptions } from '@/features/courses/api/course-admin-access';
import { checkCourseAdmin } from '@/features/courses/server/check-course-admin';

export async function requireCourseAdmin({ params }: { params: { code: string } }) {
    const access = import.meta.env.SSR
        ? await checkCourseAdmin({ data: { courseCode: params.code } })
        : await queryClient.query(courseAdminAccessOptions(params.code));

    if (!access.authenticated) {
        throw redirect({ to: '/login' });
    }

    if (!access.isAdmin) {
        throw redirect({ to: '/courses/$code', params: { code: params.code } });
    }
}
