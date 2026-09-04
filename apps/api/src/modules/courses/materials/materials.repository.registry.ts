import type { CreateMaterial, EditMaterialContent, Material, MaterialKind } from './materials.entity';
import { LinkMaterialRepository } from './elements/link/link-material.repository';
import { FileMaterialRepository } from './elements/file/file-material.repository';
import { TextMaterialRepository } from './elements/text/text-material.repository';
import type { MaterialTypeRepository } from './materials.repository.interface';

const materialRepositories = new Map<
    MaterialKind,
    MaterialTypeRepository<CreateMaterial, EditMaterialContent, Material>
>([
    ['TEXT', new TextMaterialRepository()],
    ['FILE', new FileMaterialRepository()],
    ['LINK', new LinkMaterialRepository()],
]);

export function getMaterialRepository(kind: MaterialKind) {
    const repository = materialRepositories.get(kind);
    if (!repository) throw new Error(`No repository registered for material kind: "${kind}"`);
    return repository;
}

export function getAllMaterialRepositories() {
    return [...materialRepositories.values()];
}
