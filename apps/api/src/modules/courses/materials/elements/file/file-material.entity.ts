import type { CreateMaterial, EditMaterialContent, FileMaterial as FileMaterialRecord } from '../../materials.entity';

export type FileMaterial = FileMaterialRecord;
export type CreateFileMaterial = Extract<CreateMaterial, { kind: 'FILE' }>;
export type EditFileMaterial = Extract<EditMaterialContent, { kind: 'FILE' }>;
