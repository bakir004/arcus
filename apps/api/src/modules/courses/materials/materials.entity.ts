import { courseGroups, courseMaterials } from '@/database';

export const MATERIAL_KINDS = ['TEXT', 'FILE', 'LINK'] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

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

interface TextMaterialData {
    textContent: string;
}

export interface TextMaterial extends MaterialBase, TextMaterialData {
    kind: 'TEXT';
}

interface FileMaterialData {
    title: string;
    description: string | null;
    fileKey: string;
    fileName: string | null;
    fileMimeType: string | null;
    fileSize: number | null;
}

export interface FileMaterial extends MaterialBase, FileMaterialData {
    kind: 'FILE';
}

interface LinkMaterialData {
    title: string;
    description: string | null;
    externalUrl: string;
}

export interface LinkMaterial extends MaterialBase, LinkMaterialData {
    kind: 'LINK';
}

export type Material = TextMaterial | FileMaterial | LinkMaterial;

interface CreateMaterialBase {
    uploadedById: string;
    courseGroupId: string;
    position: number;
}

type TextMaterialInput = TextMaterialData;
type FileMaterialInput = Omit<FileMaterialData, 'fileName' | 'fileMimeType' | 'fileSize'> &
    Partial<Pick<FileMaterialData, 'fileName' | 'fileMimeType' | 'fileSize'>>;
type LinkMaterialInput = LinkMaterialData;

export type CreateMaterial = CreateMaterialBase &
    (
        | ({ kind: 'TEXT' } & TextMaterialInput)
        | ({ kind: 'FILE' } & FileMaterialInput)
        | ({ kind: 'LINK' } & LinkMaterialInput)
    );

export type EditMaterialContent =
    | ({ kind: 'TEXT' } & TextMaterialInput)
    | ({ kind: 'FILE' } & FileMaterialInput)
    | ({ kind: 'LINK' } & LinkMaterialInput);

export interface MaterialGroup extends CourseGroup {
    name: string;
    materials: Material[];
}

export interface SoloMaterial {
    groupId: string;
    position: number;
    material: Material;
}

export type CourseContentElement = MaterialGroup | SoloMaterial;
