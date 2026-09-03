import { ZodError } from 'zod';
import { ExamsService } from '@/modules/exams/exams/exams.service';
import { ExamType, ExamVisibility } from '@/database/schema';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXAM_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'user-1';
const validDto = {
    title: '  Midterm  ',
    description: '  Chapters 1-3 ',
    type: ExamType.Written,
    durationMinutes: 60,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
};
const exam = { ...validDto, title: 'Midterm', description: 'Chapters 1-3' };

describe('ExamsService', () => {
    let repository: {
        create: jest.Mock;
        findAll: jest.Mock;
        findById: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    let service: ExamsService;

    beforeEach(() => {
        repository = {
            create: jest.fn().mockResolvedValue(exam),
            findAll: jest.fn().mockResolvedValue([exam]),
            findById: jest.fn().mockResolvedValue(exam),
            update: jest.fn().mockResolvedValue(exam),
            delete: jest.fn().mockResolvedValue(undefined),
        };
        service = new ExamsService(repository as never);
    });

    it('validates, normalizes, and delegates create', async () => {
        await expect(service.create(COURSE_ID, USER_ID, validDto)).resolves.toBe(exam);
        expect(repository.create).toHaveBeenCalledWith(COURSE_ID, USER_ID, {
            title: 'Midterm',
            description: 'Chapters 1-3',
            type: ExamType.Written,
            durationMinutes: 60,
            maxAttempts: 2,
            visibility: ExamVisibility.Draft,
        });
    });

    it.each([
        ['invalid title', { title: '' }],
        ['invalid type', { type: 'invalid' }],
        ['invalid duration', { durationMinutes: 0 }],
        ['invalid attempts', { maxAttempts: 21 }],
        ['invalid visibility', { visibility: 'private' }],
    ])('rejects create with %s before repository access', (_name, override) => {
        expect(() => service.create(COURSE_ID, USER_ID, { ...validDto, ...override } as never)).toThrow(ZodError);
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('propagates create repository failures', async () => {
        const failure = new Error('database unavailable');
        repository.create.mockRejectedValue(failure);
        await expect(service.create(COURSE_ID, USER_ID, validDto)).rejects.toBe(failure);
    });

    it('delegates findAll and findById without changing results', async () => {
        await expect(service.findAll(COURSE_ID)).resolves.toEqual([exam]);
        await expect(service.findById(COURSE_ID, EXAM_ID)).resolves.toBe(exam);
        expect(repository.findAll).toHaveBeenCalledWith(COURSE_ID);
        expect(repository.findById).toHaveBeenCalledWith(COURSE_ID, EXAM_ID);
    });

    it('propagates read failures', async () => {
        const failure = new Error('read failed');
        repository.findAll.mockRejectedValue(failure);
        repository.findById.mockRejectedValue(failure);
        await expect(service.findAll(COURSE_ID)).rejects.toBe(failure);
        await expect(service.findById(COURSE_ID, EXAM_ID)).rejects.toBe(failure);
    });

    it('validates, normalizes, and delegates partial updates', async () => {
        await expect(
            service.update(COURSE_ID, EXAM_ID, { title: ' Final ', description: '' }),
        ).resolves.toBe(exam);
        expect(repository.update).toHaveBeenCalledWith(COURSE_ID, EXAM_ID, {
            title: 'Final',
            description: null,
        });
    });

    it('accepts an empty update without inventing fields', async () => {
        await service.update(COURSE_ID, EXAM_ID, {});
        expect(repository.update).toHaveBeenCalledWith(COURSE_ID, EXAM_ID, {});
    });

    it('rejects invalid updates before repository access', () => {
        expect(() => service.update(COURSE_ID, EXAM_ID, { durationMinutes: 1441 })).toThrow(ZodError);
        expect(repository.update).not.toHaveBeenCalled();
    });

    it('propagates update and delete failures', async () => {
        const failure = new Error('write failed');
        repository.update.mockRejectedValue(failure);
        repository.delete.mockRejectedValue(failure);
        await expect(service.update(COURSE_ID, EXAM_ID, { title: 'Final' })).rejects.toBe(failure);
        await expect(service.delete(COURSE_ID, EXAM_ID)).rejects.toBe(failure);
    });

    it('delegates delete', async () => {
        await expect(service.delete(COURSE_ID, EXAM_ID)).resolves.toBeUndefined();
        expect(repository.delete).toHaveBeenCalledWith(COURSE_ID, EXAM_ID);
    });
});
