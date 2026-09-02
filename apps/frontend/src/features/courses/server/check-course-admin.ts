import { createServerFn } from '@tanstack/react-start';
import { getCourseMeRequest } from '@/features/courses/api/get-course-me';
import { hasRole } from '@/features/auth/lib/roles';

export const checkCourseAdmin = createServerFn({ method: 'GET' })
    .validator((data: { courseId: string }) => data)
    .handler(async ({ data }) => {
        const courseMe = await getCourseMeRequest(data.courseId);

        return {
            authenticated: courseMe !== null,
            isAdmin: courseMe !== null && hasRole(courseMe.roles, 'admin'),
        };
    });
