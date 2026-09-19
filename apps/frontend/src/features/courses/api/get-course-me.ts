import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface CourseMeResponse {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
    session?: unknown;
    roles: string[];
    permissions: string[];
}

export const getCourseMeRequest = (courseId: string): Promise<CourseMeResponse | null> =>
    apiClient<CourseMeResponse | null>(`/courses/${courseId}/me`);

export const courseMeOptions = (courseId: string) =>
    queryOptions({
        queryKey: ['courses', courseId, 'me'],
        queryFn: () => getCourseMeRequest(courseId),
        enabled: Boolean(courseId),
    });

export const useGetCourseMe = (courseId: string) => useQuery(courseMeOptions(courseId));
