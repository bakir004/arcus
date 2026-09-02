import { createServerFn } from '@tanstack/react-start';
import { getCourseMeRequest } from '@/features/courses/api/get-course-me';
import { getCoursesRequest } from '@/features/courses/api/get-courses';
import { hasRole } from '@/features/auth/lib/roles';

export const checkCourseAdmin = createServerFn({ method: 'GET' })
    .validator((data: { courseCode: string }) => data)
    .handler(async ({ data }) => {
        const courses = await getCoursesRequest().catch((error: { status?: number }) => {
            if (error.status === 401) return null;
            throw error;
        });

        if (!courses) {
            return { authenticated: false, isAdmin: false };
        }

        const course = courses.find((candidate) => candidate.code?.toLowerCase() === data.courseCode.toLowerCase());
        if (!course) {
            return { authenticated: true, isAdmin: false };
        }

        const courseMe = await getCourseMeRequest(course.id);

        return {
            authenticated: courseMe !== null,
            isAdmin: courseMe !== null && hasRole(courseMe.roles, 'admin'),
        };
    });
