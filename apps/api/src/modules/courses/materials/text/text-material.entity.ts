import { z } from 'zod';
import type { MaterialBase } from '../materials.entity';

export const textMaterialInputSchema = z
    .object({
        kind: z.literal('TEXT'),
        textContent: z.string().trim().min(1).max(100_000),
    })
    .strict();

export type TextMaterialInput = z.infer<typeof textMaterialInputSchema>;

export interface TextMaterial extends MaterialBase {
    kind: 'TEXT';
    textContent: string;
}

export type CreateTextMaterial = TextMaterialInput & {
    uploadedById: string;
    courseGroupId: string;
    position: number;
};

export type EditTextMaterial = TextMaterialInput;
