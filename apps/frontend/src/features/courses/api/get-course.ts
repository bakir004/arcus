import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import type { Course } from '@/features/courses/types';

export const getCourseRequest = (courseId: string): Promise<Course> => apiClient<Course>(`/courses/${courseId}`);

export const useGetCourse = (courseId: string) =>
    useQuery<Course>({
        queryKey: ['courses', courseId],
        queryFn: () => getCourseRequest(courseId),
        enabled: Boolean(courseId),
    });
