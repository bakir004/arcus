import { createExamSchema, examSchema, examTypeSchema, examVisibilitySchema, updateExamSchema } from '@/modules/exams/exams/exams.entity';
import { ExamType, ExamVisibility } from '@/database/schema';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXAM_ID = '22222222-2222-4222-8222-222222222222';
const base = {
    title: '  Midterm  ',
    description: '  Chapters 1-3  ',
    type: ExamType.Written,
    durationMinutes: 60,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
};

const complete = {
    ...base,
    id: EXAM_ID,
    courseId: COURSE_ID,
    createdById: 'creator',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('exam entity schemas', () => {
    it('normalizes create strings and empty descriptions', () => {
        expect(createExamSchema.parse(base)).toEqual({
            ...base,
            title: 'Midterm',
            description: 'Chapters 1-3',
        });
        expect(createExamSchema.parse({ ...base, description: '' }).description).toBeNull();
        expect(createExamSchema.parse({ ...base, description: '   ' }).description).toBeNull();
        expect(createExamSchema.parse({ ...base, description: null }).description).toBeNull();
    });

    it('accepts every supported type and visibility', () => {
        expect(examTypeSchema.parse(ExamType.Verbal)).toBe(ExamType.Verbal);
        expect(examTypeSchema.parse(ExamType.Written)).toBe(ExamType.Written);
        expect(examTypeSchema.parse(ExamType.Online)).toBe(ExamType.Online);
        expect(examVisibilitySchema.parse(ExamVisibility.Draft)).toBe(ExamVisibility.Draft);
        expect(examVisibilitySchema.parse(ExamVisibility.Published)).toBe(ExamVisibility.Published);
    });

    it('rejects invalid enum values', () => {
        expect(() => examTypeSchema.parse('invalid')).toThrow();
        expect(() => examVisibilitySchema.parse('invalid')).toThrow();
    });

    it.each([
        ['bad exam id', { id: 'not-a-uuid' }],
        ['bad course id', { courseId: 'not-a-uuid' }],
        ['empty creator', { createdById: ' ' }],
        ['empty title', { title: ' ' }],
        ['long title', { title: 'x'.repeat(256) }],
        ['long description', { description: 'x'.repeat(5001) }],
        ['fractional duration', { durationMinutes: 1.5 }],
        ['zero duration', { durationMinutes: 0 }],
        ['too long duration', { durationMinutes: 1441 }],
        ['fractional attempts', { maxAttempts: 1.5 }],
        ['zero attempts', { maxAttempts: 0 }],
        ['too many attempts', { maxAttempts: 21 }],
        ['bad created date', { createdAt: 'invalid' }],
    ])('rejects %s', (_name, override) => {
        expect(() => examSchema.parse({ ...complete, ...override })).toThrow();
    });

    it('coerces dates and normalizes complete records', () => {
        const result = examSchema.parse(complete);
        expect(result.id).toBe(EXAM_ID);
        expect(result.title).toBe('Midterm');
        expect(result.description).toBe('Chapters 1-3');
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('maps nullish descriptions to null in complete records', () => {
        expect(examSchema.parse({ ...complete, description: undefined }).description).toBeNull();
        expect(examSchema.parse({ ...complete, description: null }).description).toBeNull();
        expect(examSchema.parse({ ...complete, description: '' }).description).toBeNull();
    });

    it('supports partial updates and normalizes fields that are present', () => {
        expect(updateExamSchema.parse({ title: '  Final  ', description: '' })).toEqual({
            title: 'Final',
            description: null,
        });
        expect(updateExamSchema.parse({})).toEqual({});
    });
});
