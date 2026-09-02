import { queryOptions } from '@tanstack/react-query';
import { checkCourseAdmin } from '@/features/courses/server/check-course-admin';

export const courseAdminAccessOptions = (courseCode: string) =>
    queryOptions({
        queryKey: ['course-access', courseCode, 'admin'],
        queryFn: () => checkCourseAdmin({ data: { courseCode } }),
        staleTime: 5 * 60 * 1000,
    });
