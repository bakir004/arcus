import { courseSchema, createCourseSchema, updateCourseSchema } from '@/modules/courses/courses/courses.entity';

const ID = '11111111-1111-4111-8111-111111111111';
const validCourse = {
    id: ID,
    name: '  Algorithms  ',
    code: ' CS-101 ',
    facultyId: ID,
    createdById: ' user-1 ',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('course schemas', () => {
    it('normalizes and parses a course row', () => {
        expect(courseSchema.parse(validCourse)).toMatchObject({
            id: ID,
            name: 'Algorithms',
            code: 'CS-101',
            facultyId: ID,
            createdById: 'user-1',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        });
    });

    it('normalizes missing and null nullable create fields to null', () => {
        expect(createCourseSchema.parse({ name: 'Course', facultyId: undefined })).toEqual({
            name: 'Course',
            code: null,
            facultyId: null,
        });
        expect(createCourseSchema.parse({ name: 'Course', code: null, facultyId: null })).toEqual({
            name: 'Course',
            code: null,
            facultyId: null,
        });
    });

    it('supports partial updates and normalizes nullable values', () => {
        expect(updateCourseSchema.parse({ name: '  New name ', code: null })).toEqual({ name: 'New name', code: null });
        expect(updateCourseSchema.parse({})).toEqual({});
    });

    it.each([
        ['blank name', { name: '   ' }],
        ['long name', { name: 'x'.repeat(256) }],
        ['blank code', { name: 'Course', code: '   ' }],
        ['long code', { name: 'Course', code: 'x'.repeat(65) }],
        ['invalid faculty id', { name: 'Course', facultyId: 'invalid' }],
    ])('rejects %s', (_name, value) => {
        expect(() => createCourseSchema.parse(value)).toThrow();
    });

    it('rejects invalid persisted course data', () => {
        expect(() => courseSchema.parse({ ...validCourse, id: 'bad' })).toThrow();
        expect(() => courseSchema.parse({ ...validCourse, createdAt: 'not-a-date' })).toThrow();
        expect(() => courseSchema.parse({ ...validCourse, createdById: '' })).toThrow();
    });
});
