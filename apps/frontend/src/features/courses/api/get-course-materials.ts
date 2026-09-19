import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface MaterialBase {
    id: string;
    courseGroupId: string;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface TextMaterial extends MaterialBase {
    kind: 'TEXT';
    textContent: string;
}

export interface FileMaterial extends MaterialBase {
    kind: 'FILE';
    title: string;
    description: string | null;
    fileKey: string;
    fileName: string | null;
    fileMimeType: string | null;
    fileSize: number | null;
}

export interface LinkMaterial extends MaterialBase {
    kind: 'LINK';
    title: string;
    description: string | null;
    externalUrl: string;
}

export type CourseMaterial = TextMaterial | FileMaterial | LinkMaterial;

export interface MaterialGroup {
    id: string;
    courseId: string;
    position: number;
    name: string;
    description: string | null;
    labeled: boolean;
    weekStartDate: string | null;
    materials: CourseMaterial[];
    createdAt: string;
    updatedAt: string;
}

export const getCourseMaterialsRequest = (courseId: string): Promise<MaterialGroup[]> =>
    apiClient<MaterialGroup[]>(`/courses/${courseId}/materials`);

export const getCourseMaterialUrlRequest = (courseId: string, materialId: string): Promise<{ url: string }> =>
    apiClient<{ url: string }>(`/courses/${courseId}/materials/${materialId}/url`);

export const useGetCourseMaterials = (courseId: string) =>
    useQuery({
        queryKey: ['courses', courseId, 'materials'],
        queryFn: () => getCourseMaterialsRequest(courseId),
        enabled: Boolean(courseId),
    });
