import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface MoveCourseMaterialGroupInput {
    courseId: string;
    groupId: string;
    position: number;
}

export const moveCourseMaterialGroupRequest = ({ courseId, groupId, position }: MoveCourseMaterialGroupInput) =>
    apiClient(`/courses/${courseId}/materials/groups/${groupId}/move`, {
        method: 'PATCH',
        body: { position },
    });

export const useMoveCourseMaterialGroup = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: moveCourseMaterialGroupRequest,
        onSuccess: async (_group, variables) => {
            await queryClient.refetchQueries({
                queryKey: ['courses', variables.courseId, 'materials'],
                type: 'active',
            });
        },
        onError: async (_error, variables) => {
            await queryClient.refetchQueries({
                queryKey: ['courses', variables.courseId, 'materials'],
                type: 'active',
            });
        },
    });

    return {
        ...mutation,
        reorder: mutation.mutateAsync,
    };
};
