import { FileMaterialRepository } from './file/file-material.repository';
import { LinkMaterialRepository } from './link/link-material.repository';
import { materialInputSchema, type MaterialInput, type MaterialKind } from './materials.entity';
import type { MaterialTypeRepository } from './materials.repository.interface';
import { TextMaterialRepository } from './text/text-material.repository';

const registeredMaterialRepositories: MaterialTypeRepository[] = [
    new TextMaterialRepository(),
    new FileMaterialRepository(),
    new LinkMaterialRepository(),
];

const materialRepositories = new Map(
    registeredMaterialRepositories.map((repository) => [repository.kind, repository] as const),
);

export function getMaterialRepository(kind: MaterialKind): MaterialTypeRepository {
    const repository = materialRepositories.get(kind);
    if (!repository) throw new Error(`No repository registered for material kind: "${kind}"`);
    return repository;
}

export function getAllMaterialRepositories(): MaterialTypeRepository[] {
    return [...registeredMaterialRepositories];
}

export function parseMaterialInput(input: unknown): MaterialInput {
    const parsed = materialInputSchema.parse(input);
    return getMaterialRepository(parsed.kind).parseInput(parsed);
}
