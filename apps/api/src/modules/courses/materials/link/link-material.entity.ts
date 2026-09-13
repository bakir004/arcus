import type { CreateMaterial, EditMaterialContent, LinkMaterial as LinkMaterialRecord } from '../materials.entity';

export type LinkMaterial = LinkMaterialRecord;
export type CreateLinkMaterial = Extract<CreateMaterial, { kind: 'LINK' }>;
export type EditLinkMaterial = Extract<EditMaterialContent, { kind: 'LINK' }>;
