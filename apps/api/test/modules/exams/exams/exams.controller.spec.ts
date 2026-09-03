type SessionContext = {
    switchToHttp: () => { getRequest: () => { session?: unknown } };
};

jest.mock('@thallesp/nestjs-better-auth', () => {
    const { createParamDecorator } = jest.requireActual('@nestjs/common');
    return {
        Session: createParamDecorator((_data: unknown, context: SessionContext) => context.switchToHttp().getRequest().session),
    };
});

import { ExamsController } from '@/modules/exams/exams/exams.controller';
import { ExamType, ExamVisibility } from '@/database/schema';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const EXAM_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'user-1';
const exam = {
    id: EXAM_ID,
    courseId: COURSE_ID,
    createdById: USER_ID,
    title: 'Midterm',
    description: null,
    type: ExamType.Written,
    durationMinutes: 60,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};
const response = {
    ...exam,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
};

function createService() {
    return {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
}

describe('ExamsController', () => {
    it('creates an exam for the authenticated session user and serializes dates', async () => {
        const service = createService();
        service.create.mockResolvedValue(exam);
        const dto = { title: 'Midterm' };
        const result = await new ExamsController(service as never).create(COURSE_ID, { user: { id: USER_ID } } as never, dto as never);
        expect(result).toEqual(response);
        expect(service.create).toHaveBeenCalledWith(COURSE_ID, USER_ID, dto);
    });

    it('lists exams and serializes every row', async () => {
        const service = createService();
        service.findAll.mockResolvedValue([exam, { ...exam, id: '33333333-3333-4333-8333-333333333333' }]);
        await expect(new ExamsController(service as never).findAll(COURSE_ID)).resolves.toEqual([
            response,
            { ...response, id: '33333333-3333-4333-8333-333333333333' },
        ]);
        expect(service.findAll).toHaveBeenCalledWith(COURSE_ID);
    });

    it('returns an empty list without special casing it', async () => {
        const service = createService();
        service.findAll.mockResolvedValue([]);
        await expect(new ExamsController(service as never).findAll(COURSE_ID)).resolves.toEqual([]);
    });

    it('gets an exam by course and id', async () => {
        const service = createService();
        service.findById.mockResolvedValue(exam);
        await expect(new ExamsController(service as never).findById(COURSE_ID, EXAM_ID)).resolves.toEqual(response);
        expect(service.findById).toHaveBeenCalledWith(COURSE_ID, EXAM_ID);
    });

    it('updates an exam by course and id', async () => {
        const service = createService();
        service.update.mockResolvedValue(exam);
        const dto = { title: 'Final' };
        await expect(new ExamsController(service as never).update(COURSE_ID, EXAM_ID, dto as never)).resolves.toEqual(response);
        expect(service.update).toHaveBeenCalledWith(COURSE_ID, EXAM_ID, dto);
    });

    it('deletes an exam by course and id', async () => {
        const service = createService();
        service.delete.mockResolvedValue(undefined);
        await expect(new ExamsController(service as never).remove(COURSE_ID, EXAM_ID)).resolves.toBeUndefined();
        expect(service.delete).toHaveBeenCalledWith(COURSE_ID, EXAM_ID);
    });

    it('propagates service errors instead of masking them', async () => {
        const service = createService();
        const failure = new Error('service failed');
        service.create.mockRejectedValue(failure);
        service.findAll.mockRejectedValue(failure);
        service.findById.mockRejectedValue(failure);
        service.update.mockRejectedValue(failure);
        service.delete.mockRejectedValue(failure);
        const controller = new ExamsController(service as never);
        await expect(controller.create(COURSE_ID, { user: { id: USER_ID } } as never, {} as never)).rejects.toBe(failure);
        await expect(controller.findAll(COURSE_ID)).rejects.toBe(failure);
        await expect(controller.findById(COURSE_ID, EXAM_ID)).rejects.toBe(failure);
        await expect(controller.update(COURSE_ID, EXAM_ID, {} as never)).rejects.toBe(failure);
        await expect(controller.remove(COURSE_ID, EXAM_ID)).rejects.toBe(failure);
    });
});
