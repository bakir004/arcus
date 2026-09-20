import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface UpdateCourseMaterialGroupRequest {
    courseId: string;
    groupId: string;
    name: string;
    description?: string;
    labeled?: boolean;
    weekStartDate?: string | null;
}

export const updateCourseMaterialGroupRequest = ({ courseId, groupId, ...body }: UpdateCourseMaterialGroupRequest) =>
    apiClient(`/courses/${courseId}/materials/groups/${groupId}`, { method: 'PATCH', body });

export const useUpdateCourseMaterialGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCourseMaterialGroupRequest,
        onSuccess: (_group, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'materials'] });
        },
    });
};
