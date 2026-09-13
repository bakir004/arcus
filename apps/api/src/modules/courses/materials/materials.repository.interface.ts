import type { Database } from '@/database/client';
import type { CourseMaterial, CreateMaterial, EditMaterialContent, Material } from './materials.entity';
export interface MaterialTypeRepository<
    TCreate extends CreateMaterial,
    TEdit extends EditMaterialContent,
    TMaterial extends Material,
> {
    /** OpenAPI schemas for the type-specific request bodies. */
    readonly apiSchema: object;
    readonly updateApiSchema: object;
    fromRecord(record: CourseMaterial): TMaterial;
    create(database: Database, data: TCreate): Promise<TMaterial>;
    update(database: Database, id: string, data: TEdit): Promise<TMaterial>;
}
