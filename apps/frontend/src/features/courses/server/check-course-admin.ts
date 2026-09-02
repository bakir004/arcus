import { createServerFn } from '@tanstack/react-start';
import { getCourseMeRequest } from '@/features/courses/api/get-course-me';
import { getCourseByCodeRequest } from '@/features/courses/api/get-course';
import { hasRole } from '@/features/auth/lib/roles';

export const checkCourseAdmin = createServerFn({ method: 'GET' })
    .validator((data: { courseCode: string }) => data)
    .handler(async ({ data }) => {
        const course = await getCourseByCodeRequest(data.courseCode).catch((error: { status?: number }) => {
            if (error.status === 401) return null;
            throw error;
        });

        if (!course) return { authenticated: false, isAdmin: false };

        const courseMe = await getCourseMeRequest(course.id);

        return {
            authenticated: courseMe !== null,
            isAdmin: courseMe !== null && hasRole(courseMe.roles, 'admin'),
        };
    });
