import { CodingLanguage, QuestionType } from '@/database/schema';
import { codingRepository } from '@/modules/exams/questions/coding/coding.repository';

const id = '11111111-1111-4111-8111-111111111111';
const options = {
    type: QuestionType.Coding,
    language: CodingLanguage.JavaScript,
    mode: 'run',
    initialCode: 'initial',
    solutionCode: 'solution',
    studentCodeTemplate: 'student',
    testCodeTemplate: 'test',
    testCases: [{ name: 'case', input: '1', expectedOutput: '2', code: 'assert' }],
} as const;

describe('codingRepository', () => {
    it('validates coding options', () => {
        expect(codingRepository.validateOptions(options)).toBeNull();
        expect(codingRepository.validateOptions({ type: QuestionType.Coding })).toContain('language');
    });

    it('saves config and test cases, including default test case values', async () => {
        const configValues = jest.fn().mockResolvedValue(undefined);
        const caseValues = jest.fn().mockResolvedValue(undefined);
        const db = {
            insert: jest.fn().mockReturnValueOnce({ values: configValues }).mockReturnValueOnce({ values: caseValues }),
        };
        await codingRepository.saveOptions(db as never, id, {
            ...options,
            testCases: [options.testCases[0], {}],
        } as never);
        expect(configValues).toHaveBeenCalledWith(
            expect.objectContaining({ questionId: id, language: CodingLanguage.JavaScript, mode: 'run' }),
        );
        expect(caseValues).toHaveBeenCalledWith([
            expect.objectContaining({ questionId: id, input: '1', expectedOutput: '2', position: 0 }),
            { questionId: id, input: '', expectedOutput: '', name: null, code: null, position: 1 },
        ]);
    });

    it('does not insert test cases when omitted or empty and clears both tables', async () => {
        const db = {
            insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) }),
            delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
        };
        await codingRepository.saveOptions(db as never, id, {
            type: QuestionType.Coding,
            language: CodingLanguage.Python,
        });
        expect(db.insert).toHaveBeenCalledTimes(1);
        await codingRepository.saveOptions(db as never, id, {
            type: QuestionType.Coding,
            language: CodingLanguage.Python,
            testCases: [],
        });
        await codingRepository.clearOptions(db as never, id);
        expect(db.delete).toHaveBeenCalledTimes(2);
    });

    it('loads config and optional values with test cases', async () => {
        const config = {
            language: CodingLanguage.Python,
            mode: 'run',
            initialCode: 'i',
            solutionCode: 's',
            studentCodeTemplate: 'st',
            testCodeTemplate: 'tt',
        };
        const db = {
            query: {
                examQuestionCodingConfigs: { findFirst: jest.fn().mockResolvedValue(config) },
                examQuestionCodingTestCases: {
                    findMany: jest.fn().mockResolvedValue([{ input: 'x', expectedOutput: 'y', name: 'n', code: 'c' }]),
                },
            },
        };
        await expect(codingRepository.loadOptions(db as never, id)).resolves.toEqual({
            type: QuestionType.Coding,
            ...config,
            testCases: [{ input: 'x', expectedOutput: 'y', name: 'n', code: 'c' }],
        });
        const configQuery = db.query.examQuestionCodingConfigs.findFirst.mock.calls[0][0];
        configQuery.where({}, { eq: jest.fn() });
        const caseQuery = db.query.examQuestionCodingTestCases.findMany.mock.calls[0][0];
        caseQuery.where({}, { eq: jest.fn() });
        caseQuery.orderBy({}, { asc: jest.fn() });
    });

    it('loads defaults when config is absent and omits falsey optional values', async () => {
        const db = {
            query: {
                examQuestionCodingConfigs: { findFirst: jest.fn().mockResolvedValue(undefined) },
                examQuestionCodingTestCases: {
                    findMany: jest.fn().mockResolvedValue([{ input: '', expectedOutput: '', name: null, code: null }]),
                },
            },
        };
        await expect(codingRepository.loadOptions(db as never, id)).resolves.toEqual({
            type: QuestionType.Coding,
            language: CodingLanguage.JavaScript,
            testCases: [{ input: '', expectedOutput: '' }],
        });
    });

    it('loads many configs and test cases, including missing configs', async () => {
        const other = '22222222-2222-4222-8222-222222222222';
        const db = {
            query: {
                examQuestionCodingConfigs: {
                    findMany: jest
                        .fn()
                        .mockResolvedValue([
                            {
                                questionId: id,
                                language: CodingLanguage.Cpp,
                                mode: 'm',
                                initialCode: 'i',
                                solutionCode: 's',
                                studentCodeTemplate: 'st',
                                testCodeTemplate: 'tt',
                            },
                        ]),
                },
                examQuestionCodingTestCases: {
                    findMany: jest.fn().mockResolvedValue([
                    { questionId: id, input: 'i', expectedOutput: 'o', name: 'n', code: 'c' },
                    { questionId: id, input: '', expectedOutput: '', name: null, code: null },
                ]),
                },
            },
        };
        await expect(codingRepository.loadOptionsMany(db as never, [])).resolves.toEqual(new Map());
        await expect(codingRepository.loadOptionsMany(db as never, [id, other])).resolves.toEqual(
            new Map([
                [
                    id,
                    {
                        type: QuestionType.Coding,
                        language: CodingLanguage.Cpp,
                        mode: 'm',
                        initialCode: 'i',
                        solutionCode: 's',
                        studentCodeTemplate: 'st',
                        testCodeTemplate: 'tt',
                        testCases: [
                            { input: 'i', expectedOutput: 'o', name: 'n', code: 'c' },
                            { input: '', expectedOutput: '' },
                        ],
                    },
                ],
                [other, { type: QuestionType.Coding, language: CodingLanguage.JavaScript, testCases: [] }],
            ]),
        );
        const configQuery = db.query.examQuestionCodingConfigs.findMany.mock.calls[0][0];
        configQuery.where({}, { inArray: jest.fn() });
        const caseQuery = db.query.examQuestionCodingTestCases.findMany.mock.calls[0][0];
        caseQuery.where({}, { inArray: jest.fn() });
        caseQuery.orderBy({}, { asc: jest.fn() });
    });
});
