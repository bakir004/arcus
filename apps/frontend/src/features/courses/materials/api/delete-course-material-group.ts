import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export const deleteCourseMaterialGroupRequest = ({ courseId, groupId }: { courseId: string; groupId: string }) =>
    apiClient(`/courses/${courseId}/materials/groups/${groupId}`, { method: 'DELETE' });

export const useDeleteCourseMaterialGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCourseMaterialGroupRequest,
        onSuccess: async (_group, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'materials'] });
        },
    });
};
