import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExamDto, ExamResponseDto, UpdateExamDto } from '@/modules/exams/exams/exams.dto';
import { ExamType, ExamVisibility } from '@/database/schema';

const valid = {
    title: 'Midterm',
    description: 'Covers chapters one to three',
    type: ExamType.Written,
    durationMinutes: 120,
    maxAttempts: 2,
    visibility: ExamVisibility.Published,
};

type DtoConstructor = new () => object;

async function messages(value: unknown, type: DtoConstructor = CreateExamDto) {
    return validate(plainToInstance(type, value)).then((errors) =>
        errors.flatMap((error) => Object.values(error.constraints ?? {})),
    );
}

describe('exam DTOs', () => {
    it('accepts a complete valid create payload', async () => {
        expect(await messages(valid)).toEqual([]);
    });

    it.each([
        ['missing title', { title: undefined }],
        ['empty title', { title: '' }],
        ['non-string title', { title: 42 }],
        ['title over maximum length', { title: 'x'.repeat(256) }],
        ['non-string description', { description: 42 }],
        ['description over maximum length', { description: 'x'.repeat(5001) }],
        ['invalid type', { type: 'paper' }],
        ['missing duration', { durationMinutes: undefined }],
        ['non-integer duration', { durationMinutes: 1.5 }],
        ['duration below minimum', { durationMinutes: 0 }],
        ['duration above maximum', { durationMinutes: 1441 }],
        ['missing attempts', { maxAttempts: undefined }],
        ['non-integer attempts', { maxAttempts: 1.5 }],
        ['attempts below minimum', { maxAttempts: 0 }],
        ['attempts above maximum', { maxAttempts: 21 }],
        ['invalid visibility', { visibility: 'private' }],
    ])('rejects %s', async (_name, override) => {
        expect(await messages({ ...valid, ...override })).not.toEqual([]);
    });

    it('allows an omitted or null description', async () => {
        expect(await messages({ ...valid, description: undefined })).toEqual([]);
        expect(await messages({ ...valid, description: null })).toEqual([]);
    });

    it('rejects null for required properties', async () => {
        expect(await messages({ ...valid, title: null })).not.toEqual([]);
        expect(await messages({ ...valid, type: null })).not.toEqual([]);
        expect(await messages({ ...valid, durationMinutes: null })).not.toEqual([]);
        expect(await messages({ ...valid, maxAttempts: null })).not.toEqual([]);
        expect(await messages({ ...valid, visibility: null })).not.toEqual([]);
    });

    it('accepts an empty update because every update field is optional', async () => {
        expect(await messages({}, UpdateExamDto)).toEqual([]);
    });

    it('validates supplied update fields with the same constraints', async () => {
        expect(await messages({ title: 'x'.repeat(256) }, UpdateExamDto)).not.toEqual([]);
        expect(await messages({ durationMinutes: 0 }, UpdateExamDto)).not.toEqual([]);
        expect(await messages({ type: 'invalid' }, UpdateExamDto)).not.toEqual([]);
    });

    it('has a constructible response DTO', () => {
        const dto = new ExamResponseDto();
        Object.assign(dto, { ...valid, id: 'id', courseId: 'course', createdById: 'user' });
        expect(dto.title).toBe('Midterm');
    });
});
