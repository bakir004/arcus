import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface CreateCourseMaterialGroupRequest {
    courseId: string;
    name: string;
    description?: string;
}

export const createCourseMaterialGroupRequest = ({ courseId, name, description }: CreateCourseMaterialGroupRequest) =>
    apiClient(`/courses/${courseId}/materials/groups`, {
        method: 'POST',
        body: { name, description },
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
