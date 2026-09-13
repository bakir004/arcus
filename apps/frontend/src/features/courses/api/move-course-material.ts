import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface MoveCourseMaterialInput {
    courseId: string;
    materialId: string;
    groupId: string | null;
    position: number;
}

export const moveCourseMaterialRequest = ({ courseId, materialId, groupId, position }: MoveCourseMaterialInput) =>
    apiClient(`/courses/${courseId}/materials/${materialId}/move`, {
        method: 'PATCH',
        body: { groupId, position },
    });

export const useMoveCourseMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: moveCourseMaterialRequest,
        onSuccess: async (_material, variables) => {
            await queryClient.refetchQueries({
                queryKey: ['courses', variables.courseId, 'materials'],
                type: 'active',
            });
        },
    });
};
