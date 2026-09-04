import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCourseDto, CourseResponseDto, UpdateCourseDto } from '@/modules/courses/courses/courses.dto';

const valid = {
    name: 'Algorithms',
    code: 'CS-101',
    facultyId: '11111111-1111-4111-8111-111111111111',
};

type DtoConstructor = new () => object;

async function messages(value: unknown, type: DtoConstructor = CreateCourseDto) {
    return validate(plainToInstance(type, value)).then((errors) =>
        errors.flatMap((error) => Object.values(error.constraints ?? {})),
    );
}

describe('course DTOs', () => {
    it('accepts complete valid create data', async () => {
        expect(await messages(valid)).toEqual([]);
    });

    it.each([
        ['missing name', { name: undefined }],
        ['empty name', { name: '' }],
        ['non-string name', { name: 42 }],
        ['name over maximum', { name: 'x'.repeat(256) }],
        ['non-string code', { code: 42 }],
        ['empty code', { code: '' }],
        ['code over maximum', { code: 'x'.repeat(65) }],
        ['invalid faculty id', { facultyId: 'not-a-uuid' }],
    ])('rejects %s', async (_name, override) => {
        expect(await messages({ ...valid, ...override })).not.toEqual([]);
    });

    it('allows omitted and null optional fields', async () => {
        expect(await messages({ name: valid.name })).toEqual([]);
        expect(await messages({ ...valid, code: null, facultyId: null })).toEqual([]);
    });

    it('rejects null required and invalid optional values', async () => {
        expect(await messages({ ...valid, name: null })).not.toEqual([]);
        expect(await messages({ ...valid, code: null, facultyId: 42 })).not.toEqual([]);
    });

    it('accepts an empty update', async () => {
        expect(await messages({}, UpdateCourseDto)).toEqual([]);
    });

    it('validates supplied update fields', async () => {
        expect(await messages({ name: 'x'.repeat(256) }, UpdateCourseDto)).not.toEqual([]);
        expect(await messages({ code: '' }, UpdateCourseDto)).not.toEqual([]);
        expect(await messages({ facultyId: 'bad' }, UpdateCourseDto)).not.toEqual([]);
    });

    it('constructs a response DTO', () => {
        const dto = new CourseResponseDto();
        Object.assign(dto, { id: 'id', ...valid, createdById: 'user' });
        expect(dto.name).toBe('Algorithms');
    });
});
