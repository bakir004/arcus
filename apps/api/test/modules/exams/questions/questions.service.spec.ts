import { BadRequestException } from '@nestjs/common';
import { CodingLanguage, QuestionType } from '@/database/schema';
import { multipleChoiceRepository } from '@/modules/exams/questions/mcq/mcq.repository';
import { QuestionsService } from '@/modules/exams/questions/questions.service';

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
const createDto = { prompt: ' Prompt ', position: 1, points: 2.5, options: question.options };

function repository() {
    return {
        ensureExamExists: jest.fn().mockResolvedValue(undefined),
        hasAttempts: jest.fn().mockResolvedValue(false),
        create: jest.fn().mockResolvedValue(question),
        findAllByExam: jest.fn().mockResolvedValue([question]),
        findById: jest.fn().mockResolvedValue(question),
        update: jest.fn().mockResolvedValue(question),
        reorder: jest.fn().mockResolvedValue([question]),
        delete: jest.fn().mockResolvedValue(undefined),
    };
}

describe('QuestionsService', () => {
    it('checks exam state, validates options, normalizes, and delegates create', async () => {
        const repo = repository();
        await expect(new QuestionsService(repo as never).create(EXAM, createDto as never)).resolves.toBe(question);
        expect(repo.ensureExamExists).toHaveBeenCalledWith(EXAM);
        expect(repo.hasAttempts).toHaveBeenCalledWith(EXAM);
        expect(repo.create).toHaveBeenCalledWith(EXAM, { ...createDto, prompt: 'Prompt' });
    });

    it('supports coding and essay creates', async () => {
        const repo = repository();
        const service = new QuestionsService(repo as never);
        repo.create.mockResolvedValueOnce(question).mockResolvedValueOnce(question);
        await service.create(EXAM, {
            ...createDto,
            options: { type: QuestionType.Coding, language: CodingLanguage.JavaScript },
        } as never);
        await service.create(EXAM, { ...createDto, options: { type: QuestionType.Essay } } as never);
        expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('rejects invalid schema and subtype options without repository mutation', async () => {
        const repo = repository();
        const service = new QuestionsService(repo as never);
        await expect(service.create(EXAM, { ...createDto, points: 0 } as never)).rejects.toThrow();
        const validate = jest.spyOn(multipleChoiceRepository, 'validateOptions').mockReturnValue('invalid options');
        await expect(service.create(EXAM, createDto as never)).rejects.toThrow(BadRequestException);
        validate.mockRestore();
        expect(repo.create).not.toHaveBeenCalled();
    });

    it('lists authoring questions and sanitizes public reads', async () => {
        const repo = repository();
        const service = new QuestionsService(repo as never);
        await expect(service.findAllForAuthoring(EXAM)).resolves.toEqual([question]);
        await expect(service.findAll(EXAM)).resolves.toEqual([
            {
                ...question,
                options: {
                    type: QuestionType.MultipleChoice,
                    choices: ['a', 'b'],
                    multipleAnswers: false,
                    correctIndices: [],
                },
            },
        ]);
        await expect(service.findById(EXAM, ID)).resolves.toEqual({
            ...question,
            options: {
                type: QuestionType.MultipleChoice,
                choices: ['a', 'b'],
                multipleAnswers: false,
                correctIndices: [],
            },
        });
        repo.findById.mockResolvedValue({ ...question, options: { ...question.options, correctIndices: [0, 1] } });
        await expect(service.findById(EXAM, ID)).resolves.toMatchObject({
            options: { multipleAnswers: true, correctIndices: [] },
        });
        const essay = { ...question, options: { type: QuestionType.Essay } };
        repo.findAllByExam.mockResolvedValue([essay]);
        await expect(service.findAll(EXAM)).resolves.toEqual([essay]);
    });

    it('updates with and without options, validates, reorders, and deletes', async () => {
        const repo = repository();
        const service = new QuestionsService(repo as never);
        await expect(service.update(EXAM, ID, { prompt: 'Updated' } as never)).resolves.toBe(question);
        expect(repo.update).toHaveBeenCalledWith(EXAM, ID, { prompt: 'Updated' });
        await service.update(EXAM, ID, { options: { type: QuestionType.Essay } } as never);
        expect(repo.update).toHaveBeenLastCalledWith(EXAM, ID, { options: { type: QuestionType.Essay } });
        const validate = jest.spyOn(multipleChoiceRepository, 'validateOptions').mockReturnValue('invalid options');
        await expect(service.update(EXAM, ID, { options: question.options } as never)).rejects.toThrow(
            BadRequestException,
        );
        validate.mockRestore();
        await service.reorder(EXAM, { questionIds: [ID] });
        await service.delete(EXAM, ID);
        expect(repo.reorder).toHaveBeenCalledWith(EXAM, [ID]);
        expect(repo.delete).toHaveBeenCalledWith(EXAM, ID);
    });

    it('blocks mutations after attempts and propagates dependencies', async () => {
        const repo = repository();
        repo.hasAttempts.mockResolvedValue(true);
        const service = new QuestionsService(repo as never);
        for (const action of [
            () => service.create(EXAM, createDto as never),
            () => service.update(EXAM, ID, {}),
            () => service.reorder(EXAM, { questionIds: [ID] }),
            () => service.delete(EXAM, ID),
        ])
            await expect(action()).rejects.toEqual(
                new BadRequestException('questions cannot be modified after attempts have started'),
            );
        const failure = new Error('db failed');
        repo.findAllByExam.mockRejectedValue(failure);
        await expect(service.findAll(EXAM)).rejects.toBe(failure);
        repo.ensureExamExists.mockRejectedValue(failure);
        await expect(service.delete(EXAM, ID)).rejects.toBe(failure);
    });
});
