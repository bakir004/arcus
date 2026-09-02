import { useQuery } from '@tanstack/react-query';
import { apiClient } from '#/lib/api-client';

export interface AssignmentFile {
    id: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    uploadedAt: string;
}

export interface CourseAssignment {
    id: string;
    courseId: string;
    createdById: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    maxPoints: number;
    allowedFileExtensions: string[];
    maxSubmissionFiles: number | null;
    allowLateSubmissions: boolean;
    isPublished: boolean;
    files: AssignmentFile[];
    createdAt: string;
    updatedAt: string;
}

export const getCourseAssignmentsRequest = (courseId: string): Promise<CourseAssignment[]> =>
    apiClient<CourseAssignment[]>(`/courses/${courseId}/assignments`);

export const useGetCourseAssignments = (courseId: string) =>
    useQuery<CourseAssignment[]>({
        queryKey: ['course-assignments', courseId],
        queryFn: () => getCourseAssignmentsRequest(courseId),
        enabled: Boolean(courseId),
    });
