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
