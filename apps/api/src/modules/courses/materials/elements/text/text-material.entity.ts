import type { CreateMaterial, EditMaterialContent, TextMaterial as TextMaterialRecord } from '../../materials.entity';

export type TextMaterial = TextMaterialRecord;
export type CreateTextMaterial = Extract<CreateMaterial, { kind: 'TEXT' }>;
export type EditTextMaterial = Extract<EditMaterialContent, { kind: 'TEXT' }>;
