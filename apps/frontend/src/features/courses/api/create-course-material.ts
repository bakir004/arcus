import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export type CreateMaterialInput =
    | { kind: 'TEXT'; textContent: string }
    | { kind: 'LINK'; title: string; description?: string; externalUrl: string }
    | { kind: 'FILE'; title: string; description?: string };

export interface CreateCourseMaterialRequest {
    courseId: string;
    groupId?: string | null;
    input: CreateMaterialInput;
    file?: File;
}

export const createCourseMaterialRequest = ({ courseId, groupId, input, file }: CreateCourseMaterialRequest) => {
    const body = new FormData();
    body.append('input', JSON.stringify(input));
    if (groupId) body.append('groupId', groupId);
    if (file) body.append('file', file);
    return apiClient(`/courses/${courseId}/materials`, { method: 'POST', body });
};

export const useCreateCourseMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCourseMaterialRequest,
        onSuccess: async (_material, variables) => {
            await queryClient.refetchQueries({
                queryKey: ['courses', variables.courseId, 'materials'],
                type: 'active',
            });
        },
    });
};
