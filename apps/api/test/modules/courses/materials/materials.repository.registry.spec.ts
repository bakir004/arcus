import { MATERIAL_KINDS } from '@/modules/courses/materials/materials.entity';
import {
    getAllMaterialRepositories,
    getMaterialRepository,
    parseMaterialInput,
} from '@/modules/courses/materials/materials.repository.registry';

describe('material repository registry', () => {
    it('is the source for registered handlers and their documentation', () => {
        const repositories = getAllMaterialRepositories();
        expect(repositories.map((repository) => repository.kind)).toEqual(MATERIAL_KINDS);
        for (const repository of repositories) {
            expect(getMaterialRepository(repository.kind)).toBe(repository);
            expect(repository.inputApiSchema).toBeDefined();
            expect(repository.responseApiSchema).toBeDefined();
        }
    });

    it('dispatches discriminated input to its handler', () => {
        expect(parseMaterialInput({ kind: 'TEXT', textContent: 'Notes' })).toEqual({
            kind: 'TEXT',
            textContent: 'Notes',
        });
        expect(() => parseMaterialInput({ kind: 'LINK', title: 'Missing URL' })).toThrow();
    });
});
