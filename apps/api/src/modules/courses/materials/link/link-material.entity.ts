import { z } from 'zod';
import type { MaterialBase } from '../materials.entity';

export const linkMaterialInputSchema = z
    .object({
        kind: z.literal('LINK'),
        title: z.string().trim().min(1).max(255),
        description: z.string().trim().max(2000).nullable().optional(),
        externalUrl: z
            .url()
            .max(2048)
            .refine((value) => /^https?:\/\//i.test(value), {
                message: 'externalUrl must use HTTP or HTTPS',
            }),
    })
    .strict();

export type LinkMaterialInput = z.infer<typeof linkMaterialInputSchema>;

export interface LinkMaterial extends MaterialBase {
    kind: 'LINK';
    title: string;
    description: string | null;
    externalUrl: string;
}

export type CreateLinkMaterial = LinkMaterialInput & {
    uploadedById: string;
    courseGroupId: string;
    position: number;
};

export type EditLinkMaterial = LinkMaterialInput;
