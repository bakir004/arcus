import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import type { CourseAssignment } from '@/features/courses/api/get-course-assignments';

export const getCourseAssignmentRequest = (courseId: string, assignmentId: string): Promise<CourseAssignment> =>
    apiClient<CourseAssignment>(`/courses/${courseId}/assignments/${assignmentId}`);

export const useGetCourseAssignment = (courseId: string, assignmentId: string) =>
    useQuery<CourseAssignment>({
        queryKey: ['course-assignments', courseId, assignmentId],
        queryFn: () => getCourseAssignmentRequest(courseId, assignmentId),
        enabled: Boolean(courseId && assignmentId),
    });
