import { ExamsRepository } from '@/modules/exams/exams/exams.repository';
import { ExamCreationFailed, ExamNotFound } from '@/modules/exams/exams/exams.errors';
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
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const data = {
    title: 'Midterm',
    description: null,
    type: ExamType.Written,
    durationMinutes: 60,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
};

function createDatabase() {
    const returning = jest.fn().mockResolvedValue([exam]);
    const where = jest.fn().mockReturnValue({ returning, limit: jest.fn().mockResolvedValue([exam]) });
    const db = {
        insert: jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning }) }),
        select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    orderBy: jest.fn().mockResolvedValue([exam]),
                    limit: jest.fn().mockResolvedValue([exam]),
                }),
            }),
        }),
        update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where }) }),
        delete: jest.fn().mockReturnValue({ where }),
    };
    return { db, returning, where };
}

describe('ExamsRepository', () => {
    it('creates an exam with course and creator ownership', async () => {
        const { db } = createDatabase();
        const repository = new ExamsRepository(db as never);
        await expect(repository.create(COURSE_ID, USER_ID, data)).resolves.toBe(exam);
        expect(db.insert).toHaveBeenCalled();
        expect(db.insert().values).toHaveBeenCalledWith({ ...data, courseId: COURSE_ID, createdById: USER_ID });
    });

    it('throws a creation error when insertion returns no row', async () => {
        const { db, returning } = createDatabase();
        returning.mockResolvedValue([]);
        await expect(new ExamsRepository(db as never).create(COURSE_ID, USER_ID, data)).rejects.toEqual(
            ExamCreationFailed(),
        );
    });

    it('propagates insertion failures', async () => {
        const { db } = createDatabase();
        db.insert.mockImplementation(() => {
            throw new Error('database unavailable');
        });
        await expect(new ExamsRepository(db as never).create(COURSE_ID, USER_ID, data)).rejects.toThrow(
            'database unavailable',
        );
    });

    it('lists exams for a course in creation order', async () => {
        const { db } = createDatabase();
        await expect(new ExamsRepository(db as never).findAll(COURSE_ID)).resolves.toEqual([exam]);
        expect(db.select).toHaveBeenCalled();
    });

    it('finds an exam scoped to its course', async () => {
        const { db } = createDatabase();
        await expect(new ExamsRepository(db as never).findById(COURSE_ID, EXAM_ID)).resolves.toBe(exam);
    });

    it('throws not found when findById has no row', async () => {
        const { db } = createDatabase();
        db.select.mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
            }),
        });
        await expect(new ExamsRepository(db as never).findById(COURSE_ID, EXAM_ID)).rejects.toEqual(
            ExamNotFound(EXAM_ID),
        );
    });

    it('updates an exam and sets updatedAt', async () => {
        const { db } = createDatabase();
        await expect(new ExamsRepository(db as never).update(COURSE_ID, EXAM_ID, { title: 'Final' })).resolves.toBe(exam);
        expect(db.update).toHaveBeenCalled();
        expect(db.update().set).toHaveBeenCalledWith(expect.objectContaining({ title: 'Final', updatedAt: expect.any(Date) }));
    });

    it('throws not found when update returns no row', async () => {
        const { db, returning } = createDatabase();
        returning.mockResolvedValue([]);
        await expect(new ExamsRepository(db as never).update(COURSE_ID, EXAM_ID, {})).rejects.toEqual(
            ExamNotFound(EXAM_ID),
        );
    });

    it('deletes an exam when a row is returned', async () => {
        const { db, where } = createDatabase();
        where.mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: EXAM_ID }]) });
        await expect(new ExamsRepository(db as never).delete(COURSE_ID, EXAM_ID)).resolves.toBeUndefined();
        expect(db.delete).toHaveBeenCalled();
    });

    it('throws not found when delete affects no rows', async () => {
        const { db, where } = createDatabase();
        where.mockReturnValue({ returning: jest.fn().mockResolvedValue([]) });
        await expect(new ExamsRepository(db as never).delete(COURSE_ID, EXAM_ID)).rejects.toEqual(
            ExamNotFound(EXAM_ID),
        );
    });

    it('propagates read, update, and delete database failures', async () => {
        const { db } = createDatabase();
        db.select.mockImplementation(() => {
            throw new Error('select failed');
        });
        await expect(new ExamsRepository(db as never).findAll(COURSE_ID)).rejects.toThrow('select failed');

        const updateDb = createDatabase();
        updateDb.db.update.mockImplementation(() => {
            throw new Error('update failed');
        });
        await expect(new ExamsRepository(updateDb.db as never).update(COURSE_ID, EXAM_ID, {})).rejects.toThrow(
            'update failed',
        );

        const deleteDb = createDatabase();
        deleteDb.db.delete.mockImplementation(() => {
            throw new Error('delete failed');
        });
        await expect(new ExamsRepository(deleteDb.db as never).delete(COURSE_ID, EXAM_ID)).rejects.toThrow(
            'delete failed',
        );
    });
});
