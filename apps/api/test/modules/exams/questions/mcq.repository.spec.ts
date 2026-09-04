import { QuestionType } from '@/database/schema';
import { multipleChoiceRepository } from '@/modules/exams/questions/mcq/mcq.repository';

const id = '11111111-1111-4111-8111-111111111111';

describe('multipleChoiceRepository', () => {
    it('validates option payloads', () => {
        expect(
            multipleChoiceRepository.validateOptions({
                type: QuestionType.MultipleChoice,
                choices: ['a', 'b'],
                correctIndices: [0],
            }),
        ).toBeNull();
        expect(multipleChoiceRepository.validateOptions({ type: QuestionType.Essay })).toContain(
            'options must contain',
        );
    });

    it('saves and clears choices', async () => {
        const values = jest.fn().mockResolvedValue(undefined);
        const insert = jest.fn().mockReturnValue({ values });
        const where = jest.fn().mockResolvedValue(undefined);
        const db = { insert, delete: jest.fn().mockReturnValue({ where }) };
        await multipleChoiceRepository.saveOptions(db as never, id, {
            type: QuestionType.MultipleChoice,
            choices: ['a', 'b', 'c'],
            correctIndices: [0, 2],
        });
        expect(values).toHaveBeenCalledWith([
            { questionId: id, choiceText: 'a', position: 0, isCorrect: true },
            { questionId: id, choiceText: 'b', position: 1, isCorrect: false },
            { questionId: id, choiceText: 'c', position: 2, isCorrect: true },
        ]);
        await multipleChoiceRepository.clearOptions(db as never, id);
        expect(where).toHaveBeenCalled();
    });

    it('loads choices in database order and maps correct indices', async () => {
        const rows = [
            { choiceText: 'a', position: 0, isCorrect: true },
            { choiceText: 'b', position: 1, isCorrect: false },
        ];
        const findMany = jest.fn().mockResolvedValue(rows);
        const db = { query: { examQuestionMultipleChoiceChoices: { findMany } } };
        await expect(multipleChoiceRepository.loadOptions(db as never, id)).resolves.toEqual({
            type: QuestionType.MultipleChoice,
            choices: ['a', 'b'],
            correctIndices: [0],
        });
        const query = findMany.mock.calls[0][0];
        query.where({}, { eq: jest.fn() });
        query.orderBy({}, { asc: jest.fn() });
    });

    it('loads many choices, groups rows, and handles empty or missing groups', async () => {
        const rows = [
            { questionId: id, choiceText: 'a', position: 0, isCorrect: true },
            { questionId: id, choiceText: 'b', position: 1, isCorrect: false },
        ];
        const findMany = jest.fn().mockResolvedValue(rows);
        const db = { query: { examQuestionMultipleChoiceChoices: { findMany } } };
        await expect(multipleChoiceRepository.loadOptionsMany(db as never, [])).resolves.toEqual(new Map());
        await expect(
            multipleChoiceRepository.loadOptionsMany(db as never, [id, '22222222-2222-4222-8222-222222222222']),
        ).resolves.toEqual(
            new Map([[id, { type: QuestionType.MultipleChoice, choices: ['a', 'b'], correctIndices: [0] }]]),
        );
        expect(findMany).toHaveBeenCalled();
        const query = findMany.mock.calls.at(-1)?.[0];
        query.where({}, { inArray: jest.fn() });
        query.orderBy({}, { asc: jest.fn() });
    });
});
