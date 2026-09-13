import { materialInputSchema } from '@/modules/courses/materials/materials.entity';

describe('material input schema', () => {
    it.each([
        { kind: 'TEXT', textContent: 'Lesson notes' },
        { kind: 'FILE', title: 'Slides', description: null },
        { kind: 'LINK', title: 'Reference', externalUrl: 'https://example.com/resource' },
    ])('accepts the $kind input variant', (input) => {
        expect(materialInputSchema.parse(input)).toEqual(input);
    });

    it.each([
        { kind: 'TEXT' },
        { kind: 'FILE', title: '' },
        { kind: 'LINK', title: 'Reference', externalUrl: 'not-a-url' },
        { kind: 'UNKNOWN' },
        { kind: 'TEXT', textContent: 'Notes', title: 'cross-kind field' },
    ])('rejects invalid or mixed input %#', (input) => {
        expect(materialInputSchema.safeParse(input).success).toBe(false);
    });
});
