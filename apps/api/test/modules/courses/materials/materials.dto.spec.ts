import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMaterialDto, CreateMaterialGroupDto, EditMaterialDto } from '@/modules/courses/materials/materials.dto';

async function errors(value: unknown, Dto: new () => object = CreateMaterialDto) {
    return validate(plainToInstance(Dto, value)).then((items) =>
        items.flatMap((item) => Object.values(item.constraints ?? {})),
    );
}

const GROUP_ID = '11111111-1111-4111-8111-111111111111';

describe('material DTOs', () => {
    it('accepts an input object and parses its multipart JSON representation', async () => {
        expect(await errors({ input: { kind: 'TEXT', textContent: 'Notes' }, groupId: GROUP_ID })).toEqual([]);
        const dto = plainToInstance(CreateMaterialDto, {
            input: JSON.stringify({ kind: 'LINK', title: 'Docs', externalUrl: 'https://example.com' }),
            groupId: GROUP_ID,
        });
        expect(await validate(dto)).toEqual([]);
        expect(dto.input).toEqual({ kind: 'LINK', title: 'Docs', externalUrl: 'https://example.com' });
    });

    it('requires create input and permits an empty update', async () => {
        expect(await errors({})).not.toEqual([]);
        expect(await errors({}, EditMaterialDto)).toEqual([]);
        expect(await errors({ input: 'not-json' }, EditMaterialDto)).not.toEqual([]);
    });

    it('requires a material group title and accepts the labeled flag', async () => {
        await expect(errors({}, CreateMaterialGroupDto)).resolves.not.toEqual([]);
        await expect(errors({ name: null }, CreateMaterialGroupDto)).resolves.not.toEqual([]);
        await expect(errors({ name: '' }, CreateMaterialGroupDto)).resolves.not.toEqual([]);
        await expect(errors({ name: 'Internal identifier', labeled: false }, CreateMaterialGroupDto)).resolves.toEqual(
            [],
        );
        await expect(errors({ name: 'Group', labeled: 'false' }, CreateMaterialGroupDto)).resolves.not.toEqual([]);
    });

    it('validates group ids', async () => {
        expect(
            await errors({
                input: { kind: 'TEXT', textContent: 'Notes' },
                groupId: GROUP_ID,
            }),
        ).toEqual([]);
        expect(await errors({ input: { kind: 'TEXT', textContent: 'Notes' }, groupId: 'bad' })).not.toEqual([]);
    });
});
