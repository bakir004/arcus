import { QuestionsController } from '@/modules/exams/questions/questions.controller';
import { QuestionType } from '@/database/schema';

const EXAM = '11111111-1111-4111-8111-111111111111';
const ID = '22222222-2222-4222-8222-222222222222';
const question = {
    id: ID,
    examId: EXAM,
    prompt: 'Prompt',
    position: 1,
    points: '2.50',
    options: { type: QuestionType.MultipleChoice, choices: ['a', 'b'], correctIndices: [0] },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};
const serialized = { ...question, createdAt: '2026-01-01T00:00:00.000Z' };

function dependencies() {
    return {
        create: jest.fn().mockResolvedValue(question),
        findAllForAuthoring: jest.fn().mockResolvedValue([question]),
        findAll: jest.fn().mockResolvedValue([question]),
        findById: jest.fn().mockResolvedValue(question),
        reorder: jest.fn().mockResolvedValue([question]),
        update: jest.fn().mockResolvedValue(question),
        delete: jest.fn().mockResolvedValue(undefined),
    };
}

describe('QuestionsController', () => {
    it('handles create and authoring list with ISO serialization', async () => {
        const service = dependencies();
        const controller = new QuestionsController(service as never);
        const dto = { prompt: 'x' };
        await expect(controller.create(EXAM, dto as never)).resolves.toEqual(serialized);
        await expect(controller.findAllForAuthoring(EXAM)).resolves.toEqual([serialized]);
        expect(service.create).toHaveBeenCalledWith(EXAM, dto);
        expect(service.findAllForAuthoring).toHaveBeenCalledWith(EXAM);
    });

    it('handles public list, lookup, reorder, update, and delete', async () => {
        const service = dependencies();
        const controller = new QuestionsController(service as never);
        await expect(controller.findAll(EXAM)).resolves.toEqual([serialized]);
        await expect(controller.findById(EXAM, ID)).resolves.toEqual(serialized);
        await expect(controller.reorder(EXAM, { questionIds: [ID] })).resolves.toEqual([serialized]);
        await expect(controller.update(EXAM, ID, { prompt: 'u' } as never)).resolves.toEqual(serialized);
        await expect(controller.remove(EXAM, ID)).resolves.toBeUndefined();
        expect(service.findAll).toHaveBeenCalledWith(EXAM);
        expect(service.findById).toHaveBeenCalledWith(EXAM, ID);
        expect(service.reorder).toHaveBeenCalledWith(EXAM, { questionIds: [ID] });
        expect(service.update).toHaveBeenCalledWith(EXAM, ID, { prompt: 'u' });
        expect(service.delete).toHaveBeenCalledWith(EXAM, ID);
    });

    it('returns empty lists and propagates service failures for every route', async () => {
        const service = dependencies();
        service.findAll.mockResolvedValue([]);
        service.findAllForAuthoring.mockResolvedValue([]);
        const controller = new QuestionsController(service as never);
        await expect(controller.findAll(EXAM)).resolves.toEqual([]);
        await expect(controller.findAllForAuthoring(EXAM)).resolves.toEqual([]);
        const failure = new Error('service failed');
        service.create.mockRejectedValue(failure);
        service.findAllForAuthoring.mockRejectedValue(failure);
        service.findAll.mockRejectedValue(failure);
        service.findById.mockRejectedValue(failure);
        service.reorder.mockRejectedValue(failure);
        service.update.mockRejectedValue(failure);
        service.delete.mockRejectedValue(failure);
        await expect(controller.create(EXAM, {} as never)).rejects.toBe(failure);
        await expect(controller.findAllForAuthoring(EXAM)).rejects.toBe(failure);
        await expect(controller.findAll(EXAM)).rejects.toBe(failure);
        await expect(controller.findById(EXAM, ID)).rejects.toBe(failure);
        await expect(controller.reorder(EXAM, { questionIds: [ID] })).rejects.toBe(failure);
        await expect(controller.update(EXAM, ID, {} as never)).rejects.toBe(failure);
        await expect(controller.remove(EXAM, ID)).rejects.toBe(failure);
    });
});
