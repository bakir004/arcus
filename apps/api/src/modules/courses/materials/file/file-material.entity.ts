import { z } from 'zod';
import type { MaterialBase } from '../materials.entity';

export const fileMaterialInputSchema = z
    .object({
        kind: z.literal('FILE'),
        title: z.string().trim().min(1).max(255),
        description: z.string().trim().max(2000).nullable().optional(),
    })
    .strict();

export type FileMaterialInput = z.infer<typeof fileMaterialInputSchema>;

export interface FileMaterial extends MaterialBase {
    kind: 'FILE';
    title: string;
    description: string | null;
    fileKey: string;
    fileName: string | null;
    fileMimeType: string | null;
    fileSize: number | null;
}

export type CreateFileMaterial = FileMaterialInput & {
    uploadedById: string;
    courseGroupId: string;
    position: number;
    visibility?: boolean;
    fileKey: string;
    fileName?: string | null;
    fileMimeType?: string | null;
    fileSize?: number | null;
};

export type EditFileMaterial = FileMaterialInput & {
    fileKey: string;
    fileName?: string | null;
    fileMimeType?: string | null;
    fileSize?: number | null;
};
