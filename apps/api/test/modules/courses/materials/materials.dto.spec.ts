import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMaterialDto, EditMaterialDto } from '@/modules/courses/materials/materials.dto';

async function errors(value: unknown, Dto: new () => object = CreateMaterialDto) {
    return validate(plainToInstance(Dto, value)).then((items) =>
        items.flatMap((item) => Object.values(item.constraints ?? {})),
    );
}

describe('material DTOs', () => {
    it('accepts an input object and parses its multipart JSON representation', async () => {
        expect(await errors({ input: { kind: 'TEXT', textContent: 'Notes' } })).toEqual([]);
        const dto = plainToInstance(CreateMaterialDto, {
            input: JSON.stringify({ kind: 'LINK', title: 'Docs', externalUrl: 'https://example.com' }),
        });
        expect(await validate(dto)).toEqual([]);
        expect(dto.input).toEqual({ kind: 'LINK', title: 'Docs', externalUrl: 'https://example.com' });
    });

    it('requires create input and permits an empty update', async () => {
        expect(await errors({})).not.toEqual([]);
        expect(await errors({}, EditMaterialDto)).toEqual([]);
        expect(await errors({ input: 'not-json' }, EditMaterialDto)).not.toEqual([]);
    });

    it('validates group ids', async () => {
        expect(
            await errors({
                input: { kind: 'TEXT', textContent: 'Notes' },
                groupId: '11111111-1111-4111-8111-111111111111',
            }),
        ).toEqual([]);
        expect(await errors({ input: { kind: 'TEXT', textContent: 'Notes' }, groupId: 'bad' })).not.toEqual([]);
    });
});
