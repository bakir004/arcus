import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QuestionType, CodingLanguage } from '@/database/schema';
import {
    CreateQuestionDto,
    QuestionResponseDto,
    ReorderQuestionsDto,
    UpdateQuestionDto,
} from '@/modules/exams/questions/questions.dto';

const valid = {
    prompt: 'Question',
    position: 1,
    points: 2.5,
    options: { type: QuestionType.Essay },
};
const id = '11111111-1111-4111-8111-111111111111';

async function errors(value: unknown, Dto: new () => object = CreateQuestionDto) {
    return validate(plainToInstance(Dto, value)).then((items) =>
        items.flatMap((item) => Object.values(item.constraints ?? {})),
    );
}

describe('question DTOs', () => {
    it('accepts valid create payloads and all option objects as objects', async () => {
        expect(await errors(valid)).toEqual([]);
        expect(
            await errors({
                ...valid,
                options: { type: QuestionType.MultipleChoice, choices: ['a', 'b'], correctIndices: [0] },
            }),
        ).toEqual([]);
        expect(
            await errors({ ...valid, options: { type: QuestionType.Coding, language: CodingLanguage.JavaScript } }),
        ).toEqual([]);
    });

    it.each([
        ['missing prompt', { prompt: undefined }],
        ['empty prompt', { prompt: '' }],
        ['non-string prompt', { prompt: 1 }],
        ['long prompt', { prompt: 'x'.repeat(4001) }],
        ['missing position', { position: undefined }],
        ['fractional position', { position: 1.5 }],
        ['zero position', { position: 0 }],
        ['missing points', { points: undefined }],
        ['string points', { points: '2' }],
        ['too precise points', { points: 1.111 }],
        ['low points', { points: 0 }],
        ['high points', { points: 101 }],
        ['missing options', { options: undefined }],
        ['array options', { options: [] }],
        ['null options', { options: null }],
    ])('rejects %s', async (_name, override) => expect(await errors({ ...valid, ...override })).not.toEqual([]));

    it('rejects null required fields and accepts empty updates', async () => {
        for (const field of ['prompt', 'position', 'points', 'options']) {
            expect(await errors({ ...valid, [field]: null })).not.toEqual([]);
        }
        expect(await errors({}, UpdateQuestionDto)).toEqual([]);
        expect(await errors({ prompt: 'x'.repeat(4001) }, UpdateQuestionDto)).not.toEqual([]);
        expect(await errors({ options: undefined }, UpdateQuestionDto)).toEqual([]);
    });

    it('validates reorder arrays and UUIDs', async () => {
        expect(await errors({ questionIds: [id] }, ReorderQuestionsDto)).toEqual([]);
        for (const value of [
            {},
            { questionIds: [] },
            { questionIds: [id, id] },
            { questionIds: ['bad'] },
            { questionIds: [id, 'bad'] },
            { questionIds: null },
        ])
            expect(await errors(value, ReorderQuestionsDto)).not.toEqual([]);
    });

    it('constructs response DTOs', () => {
        const dto = new QuestionResponseDto();
        Object.assign(dto, { id, prompt: 'Question', createdAt: new Date().toISOString() });
        expect(dto.prompt).toBe('Question');
    });
});
