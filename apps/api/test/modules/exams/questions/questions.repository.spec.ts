import { QuestionType } from '@/database/schema';
import {
    ExamNotFound,
    InvalidQuestionOrder,
    QuestionCreationFailed,
    QuestionNotFound,
    QuestionOptionsNotFound,
    QuestionPositionConflict,
} from '@/modules/exams/questions/questions.errors';
import { QuestionsRepository } from '@/modules/exams/questions/questions.repository';

const EXAM = '11111111-1111-4111-8111-111111111111';
const ID = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const mcRow = {
    id: ID,
    examId: EXAM,
    prompt: 'MC',
    position: 1,
    points: '2.50',
    type: QuestionType.MultipleChoice,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};
const essayRow = { ...mcRow, id: OTHER, prompt: 'Essay', position: 2, type: QuestionType.Essay };
const mcOptions: { type: QuestionType.MultipleChoice; choices: string[]; correctIndices: number[] } = {
    type: QuestionType.MultipleChoice,
    choices: ['a', 'b'],
    correctIndices: [0],
};

function database(overrides: { rows?: unknown[]; returning?: unknown[]; exam?: unknown; optionRows?: unknown[] } = {}) {
    const rows = overrides.rows ?? [mcRow];
    const returning = overrides.returning ?? [mcRow];
    const findManyQuestions = jest.fn().mockResolvedValue(rows);
    const findFirstQuestion = jest.fn().mockResolvedValue(rows[0]);
    const optionRows = overrides.optionRows ?? [
        { questionId: ID, choiceText: 'a', position: 0, isCorrect: true },
        { questionId: ID, choiceText: 'b', position: 1, isCorrect: false },
    ];
    const returningFn = jest.fn().mockResolvedValue(returning);
    const values = jest.fn().mockImplementation((value: unknown) => {
        const isQuestionInsert =
            typeof value === 'object' && value !== null && !Array.isArray(value) && 'examId' in value;
        return isQuestionInsert ? { returning: returningFn } : Promise.resolve(undefined);
    });
    const where = jest.fn().mockReturnValue({ returning: returningFn });
    const insert = jest.fn().mockReturnValue({ values });
    const update = jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where }) });
    const deleteWhere = jest.fn().mockResolvedValue(undefined);
    const tx = {
        insert,
        update,
        delete: jest.fn().mockReturnValue({ where: deleteWhere }),
        execute: jest.fn().mockResolvedValue(undefined),
        select: jest
            .fn()
            .mockReturnValue({
                from: jest
                    .fn()
                    .mockReturnValue({
                        where: jest.fn().mockResolvedValue(rows.map((row) => ({ id: (row as { id: string }).id }))),
                    }),
            }),
        query: {
            examQuestions: { findMany: findManyQuestions, findFirst: findFirstQuestion },
            examQuestionMultipleChoiceChoices: { findMany: jest.fn().mockResolvedValue(optionRows) },
            examQuestionCodingConfigs: {
                findFirst: jest.fn().mockResolvedValue(undefined),
                findMany: jest.fn().mockResolvedValue([]),
            },
            examQuestionCodingTestCases: { findMany: jest.fn().mockResolvedValue([]) },
        },
    };
    const db = {
        transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(tx)),
        insert,
        update,
        delete: jest.fn().mockReturnValue({ where: deleteWhere }),
        select: tx.select,
        query: {
            examQuestions: { findMany: findManyQuestions, findFirst: findFirstQuestion },
            exams: {
                findFirst: jest
                    .fn()
                    .mockResolvedValue(Object.hasOwn(overrides, 'exam') ? overrides.exam : { id: EXAM }),
            },
            examQuestionMultipleChoiceChoices: tx.query.examQuestionMultipleChoiceChoices,
            examQuestionCodingConfigs: tx.query.examQuestionCodingConfigs,
            examQuestionCodingTestCases: tx.query.examQuestionCodingTestCases,
        },
    };
    const examFindFirst = db.query.exams.findFirst;
    return { db, tx, findManyQuestions, findFirstQuestion, returningFn, values, deleteWhere, examFindFirst };
}

describe('QuestionsRepository', () => {
    it('creates and hydrates a multiple choice question in a transaction', async () => {
        const { db, values } = database();
        const data = { prompt: 'MC', position: 1, points: 2.5, options: mcOptions };
        await expect(new QuestionsRepository(db as never).create(EXAM, data)).resolves.toMatchObject({
            id: ID,
            options: mcOptions,
        });
        expect(values).toHaveBeenCalledWith(
            expect.objectContaining({ examId: EXAM, points: '2.5', type: QuestionType.MultipleChoice }),
        );
        expect(db.transaction).toHaveBeenCalled();
    });

    it('maps create failures and empty returning rows', async () => {
        const missing = database({ returning: [] });
        await expect(
            new QuestionsRepository(missing.db as never).create(EXAM, {
                prompt: 'x',
                position: 1,
                points: 1,
                options: { type: QuestionType.Essay },
            }),
        ).rejects.toEqual(QuestionCreationFailed());
        const duplicate = database();
        duplicate.returningFn.mockRejectedValue({ code: '23505' });
        await expect(
            new QuestionsRepository(duplicate.db as never).create(EXAM, {
                prompt: 'x',
                position: 1,
                points: 1,
                options: { type: QuestionType.Essay },
            }),
        ).rejects.toEqual(QuestionPositionConflict());
        const fk = database();
        fk.returningFn.mockRejectedValue({ code: '23503' });
        await expect(
            new QuestionsRepository(fk.db as never).create(EXAM, {
                prompt: 'x',
                position: 1,
                points: 1,
                options: { type: QuestionType.Essay },
            }),
        ).rejects.toEqual(ExamNotFound());
        const failure = database();
        failure.returningFn.mockRejectedValue(new Error('insert failed'));
        await expect(
            new QuestionsRepository(failure.db as never).create(EXAM, {
                prompt: 'x',
                position: 1,
                points: 1,
                options: { type: QuestionType.Essay },
            }),
        ).rejects.toThrow('insert failed');
    });

    it('lists by exam, orders rows, and hydrates each supported type', async () => {
        const coding = { ...mcRow, id: OTHER, type: QuestionType.Coding };
        const essay = { ...mcRow, id: '44444444-4444-4444-8444-444444444444', type: QuestionType.Essay };
        const { db } = database({ rows: [mcRow, coding, essay] });
        db.query.examQuestionCodingConfigs.findMany.mockResolvedValue([]);
        db.query.examQuestionCodingTestCases.findMany.mockResolvedValue([]);
        await expect(new QuestionsRepository(db as never).findAllByExam(EXAM)).resolves.toHaveLength(3);
        expect(db.query.examQuestions.findMany).toHaveBeenCalled();
        const query = db.query.examQuestions.findMany.mock.calls[0][0];
        query.where({}, { eq: jest.fn() });
        query.orderBy({}, { asc: jest.fn() });
        const empty = database({ rows: [] });
        await expect(new QuestionsRepository(empty.db as never).findAllByExam(EXAM)).resolves.toEqual([]);
    });

    it('rejects missing exams, questions, and options', async () => {
        const absentExam = database({ exam: undefined });
        await expect(new QuestionsRepository(absentExam.db as never).findAllByExam(EXAM)).rejects.toEqual(
            ExamNotFound(EXAM),
        );
        const absentQuestion = database({ rows: [] });
        await expect(new QuestionsRepository(absentQuestion.db as never).findById(EXAM, ID)).rejects.toEqual(
            QuestionNotFound(ID),
        );
        const absentOptions = database({ optionRows: [] });
        await expect(new QuestionsRepository(absentOptions.db as never).findAllByExam(EXAM)).rejects.toEqual(
            QuestionOptionsNotFound(ID),
        );
    });

    it('finds by scoped id and updates fields with or without replacing options', async () => {
        const found = database();
        await expect(new QuestionsRepository(found.db as never).findById(EXAM, ID)).resolves.toMatchObject({
            id: ID,
            options: mcOptions,
        });
        const findQuery = found.db.query.examQuestions.findFirst.mock.calls[0][0];
        findQuery.where({}, { and: jest.fn(), eq: jest.fn() });
        const updated = database({ returning: [mcRow] });
        const repo = new QuestionsRepository(updated.db as never);
        await expect(repo.update(EXAM, ID, { prompt: 'new', position: 2, points: 3 })).resolves.toMatchObject({
            options: mcOptions,
        });
        await expect(repo.update(EXAM, ID, { options: { type: QuestionType.Essay } })).resolves.toMatchObject({
            options: { type: QuestionType.Essay },
        });
        const missing = database({ returning: [] });
        await expect(new QuestionsRepository(missing.db as never).update(EXAM, ID, {})).rejects.toEqual(
            QuestionNotFound(ID),
        );
    });

    it('maps update database errors and reorders all questions', async () => {
        const duplicate = database();
        duplicate.returningFn.mockRejectedValue({ code: '23505' });
        await expect(new QuestionsRepository(duplicate.db as never).update(EXAM, ID, {})).rejects.toEqual(
            QuestionPositionConflict(),
        );
        const repoDb = database({ rows: [mcRow, essayRow] });
        const repo = new QuestionsRepository(repoDb.db as never);
        await expect(repo.reorder(EXAM, [OTHER, ID])).resolves.toHaveLength(2);
        expect(repoDb.tx.execute).toHaveBeenCalled();
        const selectQuery = repoDb.tx.select.mock.calls[0][0];
        expect(selectQuery).toBeDefined();
        const reorderedQuery = repoDb.tx.query.examQuestions.findMany.mock.calls[0][0];
        reorderedQuery.where({}, { eq: jest.fn() });
        reorderedQuery.orderBy({}, { asc: jest.fn() });
        const invalid = database({ rows: [mcRow, essayRow] });
        await expect(new QuestionsRepository(invalid.db as never).reorder(EXAM, [ID])).rejects.toEqual(
            InvalidQuestionOrder(),
        );
    });

    it('deletes scoped questions and clears all option repositories', async () => {
        const { db, tx, deleteWhere } = database();
        await expect(new QuestionsRepository(db as never).delete(EXAM, ID)).resolves.toBeUndefined();
        expect(deleteWhere).toHaveBeenCalled();
        const deleteQuery = tx.query.examQuestions.findFirst.mock.calls[0][0];
        deleteQuery.where({}, { and: jest.fn(), eq: jest.fn() });
        const missing = database({ rows: [] });
        await expect(new QuestionsRepository(missing.db as never).delete(EXAM, ID)).rejects.toEqual(
            QuestionNotFound(ID),
        );
    });

    it('checks exam existence and hasAttempts seam', async () => {
        const { db, examFindFirst } = database();
        const repo = new QuestionsRepository(db as never);
        await expect(repo.ensureExamExists(EXAM)).resolves.toBeUndefined();
        const examQuery = examFindFirst.mock.calls[0][0];
        examQuery.where({}, { eq: jest.fn() });
        await expect(repo.hasAttempts(EXAM)).resolves.toBe(false);
        const failure = database({ exam: undefined });
        await expect(new QuestionsRepository(failure.db as never).ensureExamExists(EXAM)).rejects.toEqual(
            ExamNotFound(EXAM),
        );
    });
});
