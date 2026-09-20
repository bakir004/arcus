import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export const deleteCourseMaterialRequest = ({ courseId, materialId }: { courseId: string; materialId: string }) =>
    apiClient(`/courses/${courseId}/materials/${materialId}`, { method: 'DELETE' });

export const useDeleteCourseMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCourseMaterialRequest,
        onSuccess: async (_material, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'materials'] });
        },
    });
};
