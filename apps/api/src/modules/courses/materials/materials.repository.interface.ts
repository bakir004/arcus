import type { Database } from '@/database/client';
import type { CourseMaterial, CreateMaterial, EditMaterialContent, Material } from './materials.entity';
import type { CreateFileMaterial, EditFileMaterial } from './elements/file/file-material.entity';
import type { CreateLinkMaterial, EditLinkMaterial } from './elements/link/link-material.entity';
import type { CreateTextMaterial, EditTextMaterial } from './elements/text/text-material.entity';

export interface MaterialTypeRepository<
    TCreate extends CreateMaterial,
    TEdit extends EditMaterialContent,
    TMaterial extends Material,
> {
    fromRecord(record: CourseMaterial): TMaterial;
    create(database: Database, data: TCreate): Promise<TMaterial>;
    update(database: Database, id: string, data: TEdit): Promise<TMaterial>;
}
