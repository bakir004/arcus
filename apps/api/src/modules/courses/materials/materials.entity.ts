import { z } from 'zod';
import { courseGroups, courseMaterials } from '@/database';
import {
    fileMaterialInputSchema,
    type CreateFileMaterial,
    type EditFileMaterial,
    type FileMaterial,
} from './file/file-material.entity';
import {
    linkMaterialInputSchema,
    type CreateLinkMaterial,
    type EditLinkMaterial,
    type LinkMaterial,
} from './link/link-material.entity';
import {
    textMaterialInputSchema,
    type CreateTextMaterial,
    type EditTextMaterial,
    type TextMaterial,
} from './text/text-material.entity';

export const materialInputSchema = z.discriminatedUnion('kind', [
    textMaterialInputSchema,
    fileMaterialInputSchema,
    linkMaterialInputSchema,
]);

export type MaterialInput = z.infer<typeof materialInputSchema>;
export const MATERIAL_KINDS = materialInputSchema.options.map((schema) => schema.shape.kind.value);
export type MaterialKind = MaterialInput['kind'];

export type CourseGroup = typeof courseGroups.$inferSelect;
export type CreateCourseGroup = typeof courseGroups.$inferInsert;
export type EditCourseGroup = Partial<Pick<CreateCourseGroup, 'name' | 'description' | 'position'>>;

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type CreateCourseMaterial = typeof courseMaterials.$inferInsert;

export type MaterialBase = Omit<
    CourseMaterial,
    | 'kind'
    | 'textContent'
    | 'title'
    | 'description'
    | 'externalUrl'
    | 'fileKey'
    | 'fileName'
    | 'fileMimeType'
    | 'fileSize'
>;

export type { FileMaterial, LinkMaterial, TextMaterial };
export type Material = TextMaterial | FileMaterial | LinkMaterial;
export type CreateMaterial = CreateTextMaterial | CreateFileMaterial | CreateLinkMaterial;
export type EditMaterialContent = EditTextMaterial | EditFileMaterial | EditLinkMaterial;

export interface MaterialGroup extends CourseGroup {
    materials: Material[];
}
