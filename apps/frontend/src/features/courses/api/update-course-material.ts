import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import type { CreateMaterialInput } from './create-course-material';

export interface UpdateCourseMaterialRequest {
    courseId: string;
    materialId: string;
    input?: CreateMaterialInput;
    visibility?: boolean;
    file?: File;
}

export const updateCourseMaterialRequest = ({
    courseId,
    materialId,
    input,
    visibility,
    file,
}: UpdateCourseMaterialRequest) => {
    const body = new FormData();
    if (input) body.append('input', JSON.stringify(input));
    if (visibility !== undefined) body.append('visibility', String(visibility));
    if (file) body.append('file', file);
    return apiClient(`/courses/${courseId}/materials/${materialId}`, { method: 'PATCH', body });
};

export const useUpdateCourseMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCourseMaterialRequest,
        onSuccess: async (_material, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId, 'materials'] });
        },
    });
};
