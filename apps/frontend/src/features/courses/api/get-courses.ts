import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import type { Course } from '@/features/courses/types';

export const getCoursesRequest = (): Promise<Course[]> => apiClient<Course[]>('/courses');

export const useGetCourses = ({ enabled = true }: { enabled?: boolean } = {}) =>
    useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: getCoursesRequest,
        enabled,
    });
