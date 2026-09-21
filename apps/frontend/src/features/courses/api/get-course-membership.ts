import { useQuery } from '@tanstack/react-query';
import { getCourseMeRequest } from './get-course-me';

export const useGetCourseMembership = (courseId: string) =>
    useQuery({
        queryKey: ['courses', courseId, 'membership'],
        queryFn: () => getCourseMeRequest(courseId),
        enabled: Boolean(courseId),
    });
