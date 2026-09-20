import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface CreateCourseMaterialGroupRequest {
    courseId: string;
    name: string;
    description?: string;
    labeled?: boolean;
    weekStartDate?: string | null;
}

export const createCourseMaterialGroupRequest = ({
    courseId,
    name,
    description,
    labeled,
    weekStartDate,
}: CreateCourseMaterialGroupRequest) =>
    apiClient(`/courses/${courseId}/materials/groups`, {
        method: 'POST',
        body: { name, description, labeled, weekStartDate },
    });

export const useCreateCourseMaterialGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCourseMaterialGroupRequest,
        onSuccess: (_group, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'materials'] });
        },
    });
};
