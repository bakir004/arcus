import { CodingLanguage, QuestionType } from '@/database/schema';
import { codingOptionsSchema } from '@/modules/exams/questions/coding/coding.entity';
import { essayOptionsSchema } from '@/modules/exams/questions/essay/essay.entity';
import { multipleChoiceOptionsSchema } from '@/modules/exams/questions/mcq/mcq.entity';
import {
    createQuestionSchema,
    questionOptionsSchema,
    questionSchema,
    updateQuestionSchema,
} from '@/modules/exams/questions/questions.entity';

const ID = '11111111-1111-4111-8111-111111111111';
const base = {
    prompt: '  Choose an answer ',
    position: 1,
    points: 2.5,
    options: { type: QuestionType.MultipleChoice, choices: ['A', 'B'], correctIndices: [1] },
};
const persisted = {
    ...base,
    id: ID,
    examId: ID,
    points: '2.50',
    createdAt: '2026-01-01T00:00:00.000Z',
};

describe('question entities and option schemas', () => {
    it('parses and normalizes question data', () => {
        const result = questionSchema.parse({ ...persisted, prompt: '  Prompt  ' });
        expect(result.prompt).toBe('Prompt');
        expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('accepts valid create and partial update data', () => {
        expect(createQuestionSchema.parse(base)).toMatchObject({ prompt: 'Choose an answer' });
        expect(updateQuestionSchema.parse({ prompt: ' New ', points: 1.25 })).toEqual({ prompt: 'New', points: 1.25 });
        expect(updateQuestionSchema.parse({})).toEqual({});
    });

    it.each([
        ['blank prompt', { ...base, prompt: ' ' }],
        ['long prompt', { ...base, prompt: 'x'.repeat(4001) }],
        ['zero position', { ...base, position: 0 }],
        ['fractional position', { ...base, position: 1.1 }],
        ['low points', { ...base, points: 0 }],
        ['high points', { ...base, points: 100.01 }],
        ['too precise points', { ...base, points: 1.001 }],
        ['bad persisted id', { ...persisted, id: 'bad' }],
        ['bad persisted points', { ...persisted, points: '1.001' }],
        ['bad date', { ...persisted, createdAt: 'nope' }],
    ])('rejects %s', (_name, value) =>
        expect(() => ('id' in value ? questionSchema : createQuestionSchema).parse(value)).toThrow(),
    );

    it('validates decimal string boundaries for persisted points', () => {
        for (const points of ['0.01', '1', '100', '100.00']) {
            expect(questionSchema.parse({ ...persisted, points }).points).toBe(points);
        }
        for (const points of ['0', '0.001', '100.01', 'abc']) {
            expect(() => questionSchema.parse({ ...persisted, points })).toThrow();
        }
    });

    it('validates multiple choice constraints and normalization-independent rules', () => {
        expect(multipleChoiceOptionsSchema.parse(base.options)).toEqual(base.options);
        for (const options of [
            { type: QuestionType.MultipleChoice, choices: ['A'], correctIndices: [0] },
            { type: QuestionType.MultipleChoice, choices: ['A', 'A'], correctIndices: [0] },
            { type: QuestionType.MultipleChoice, choices: [' ', 'B'], correctIndices: [0] },
            { type: QuestionType.MultipleChoice, choices: ['A', 'B'], correctIndices: [2] },
            { type: QuestionType.MultipleChoice, choices: ['A', 'B'], correctIndices: [0, 0] },
            { type: QuestionType.MultipleChoice, choices: ['A', 'B'], correctIndices: [] },
            { type: QuestionType.MultipleChoice, choices: ['A', 'B'], correctIndices: [0], extra: true },
        ])
            expect(() => multipleChoiceOptionsSchema.parse(options)).toThrow();
    });

    it('validates coding options, optional fields, and all languages', () => {
        for (const language of Object.values(CodingLanguage)) {
            expect(codingOptionsSchema.parse({ type: QuestionType.Coding, language })).toMatchObject({ language });
        }
        expect(
            codingOptionsSchema.parse({
                type: QuestionType.Coding,
                language: CodingLanguage.Python,
                mode: 'run',
                initialCode: 'x',
                solutionCode: 'y',
                studentCodeTemplate: 'z',
                testCodeTemplate: 't',
                testCases: [{ id: '1', name: 'case', input: 'a', expectedOutput: 'b', code: 'c' }],
            }),
        ).toHaveProperty('testCases');
        expect(() => codingOptionsSchema.parse({ type: QuestionType.Coding, language: 'ruby' })).toThrow();
        expect(() =>
            codingOptionsSchema.parse({
                type: QuestionType.Coding,
                language: CodingLanguage.Cpp,
                mode: 'x'.repeat(65),
            }),
        ).toThrow();
        expect(() =>
            codingOptionsSchema.parse({
                type: QuestionType.Coding,
                language: CodingLanguage.Cpp,
                testCases: [{ input: 'x', unknown: true }],
            }),
        ).toThrow();
    });

    it('accepts only the strict essay discriminator', () => {
        expect(essayOptionsSchema.parse({ type: QuestionType.Essay })).toEqual({ type: QuestionType.Essay });
        expect(questionOptionsSchema.parse({ type: QuestionType.Essay })).toEqual({ type: QuestionType.Essay });
        expect(() => essayOptionsSchema.parse({ type: QuestionType.Essay, choices: [] })).toThrow();
        expect(() => questionOptionsSchema.parse({ type: 'unknown' })).toThrow();
    });
});
