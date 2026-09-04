import { QuestionType } from '@/database/schema';
import { essayRepository } from '@/modules/exams/questions/essay/essay.repository';

const id = '11111111-1111-4111-8111-111111111111';

describe('essayRepository', () => {
    it('validates, saves, clears, and loads essay options', async () => {
        expect(essayRepository.validateOptions({ type: QuestionType.Essay })).toBeNull();
        expect(essayRepository.validateOptions({ type: QuestionType.Essay, choices: [] })).toContain('must not');
        const values = jest.fn().mockResolvedValue(undefined);
        const where = jest.fn().mockResolvedValue(undefined);
        const db = { insert: jest.fn().mockReturnValue({ values }), delete: jest.fn().mockReturnValue({ where }) };
        await essayRepository.saveOptions(db as never, id, { type: QuestionType.Essay });
        expect(values).toHaveBeenCalledWith({ questionId: id });
        await essayRepository.clearOptions(db as never, id);
        expect(where).toHaveBeenCalled();
        await expect(essayRepository.loadOptions(db as never, id)).resolves.toEqual({ type: QuestionType.Essay });
    });

    it('loads essay options for every requested id', async () => {
        const ids = [id, '22222222-2222-4222-8222-222222222222'];
        await expect(essayRepository.loadOptionsMany({} as never, ids)).resolves.toEqual(
            new Map(ids.map((value) => [value, { type: QuestionType.Essay }])),
        );
        await expect(essayRepository.loadOptionsMany({} as never, [])).resolves.toEqual(new Map());
    });
});
