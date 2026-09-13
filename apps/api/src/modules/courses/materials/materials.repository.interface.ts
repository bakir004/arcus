import type { Database } from '@/database/client';
import type { StorageService } from '@/storage/storage.service';
import type {
    CourseMaterial,
    CreateMaterial,
    EditMaterialContent,
    Material,
    MaterialInput,
    MaterialKind,
} from './materials.entity';

export interface MaterialTypeRepository {
    readonly kind: MaterialKind;
    /** OpenAPI schema for the kind-specific input object. */
    readonly inputApiSchema: object;
    /** OpenAPI schema for the material returned by this handler. */
    readonly responseApiSchema: object;
    parseInput(input: unknown): MaterialInput;
    prepareCreate(
        input: MaterialInput,
        file: Express.Multer.File | undefined,
        storage: StorageService,
    ): Promise<EditMaterialContent>;
    prepareEdit(
        input: MaterialInput | undefined,
        current: Material,
        file: Express.Multer.File | undefined,
        storage: StorageService,
    ): Promise<EditMaterialContent>;
    resourceKey(material: Material | EditMaterialContent): string | undefined;
    toResponse(material: Material): Material;
    fromRecord(record: CourseMaterial): Material;
    create(database: Database, data: CreateMaterial): Promise<Material>;
    update(database: Database, id: string, data: EditMaterialContent): Promise<Material>;
}
