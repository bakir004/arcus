import { CoursesRepository } from '@/modules/courses/courses/courses.repository';
import { CourseCreationFailed, CourseNotFound } from '@/modules/courses/courses/courses.errors';

const ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-1';
const course = {
    id: ID,
    name: 'Algorithms',
    code: 'CS-101',
    facultyId: null,
    createdById: USER_ID,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const data = { name: 'Algorithms', code: 'CS-101', facultyId: null };

function createDatabase() {
    const returning = jest.fn().mockResolvedValue([course]);
    const limit = jest.fn().mockResolvedValue([course]);
    const orderBy = jest.fn().mockResolvedValue([course]);
    const where = jest.fn().mockReturnValue({ returning, limit });
    const db = {
        insert: jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning }) }),
        select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit }), orderBy }),
        }),
        update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where }) }),
        delete: jest.fn().mockReturnValue({ where }),
    };
    return { db, returning, limit, orderBy, where };
}

describe('CoursesRepository', () => {
    it('creates a course with the creator id', async () => {
        const { db } = createDatabase();
        await expect(new CoursesRepository(db as never).create(USER_ID, data)).resolves.toBe(course);
        expect(db.insert().values).toHaveBeenCalledWith({ ...data, createdById: USER_ID });
    });

    it('throws when creation returns no row', async () => {
        const { db, returning } = createDatabase();
        returning.mockResolvedValue([]);
        await expect(new CoursesRepository(db as never).create(USER_ID, data)).rejects.toEqual(CourseCreationFailed());
    });

    it('propagates create database errors', async () => {
        const { db } = createDatabase();
        db.insert.mockImplementation(() => {
            throw new Error('insert failed');
        });
        await expect(new CoursesRepository(db as never).create(USER_ID, data)).rejects.toThrow('insert failed');
    });

    it('lists courses using the database ordering query', async () => {
        const { db, orderBy } = createDatabase();
        await expect(new CoursesRepository(db as never).findAll()).resolves.toEqual([course]);
        expect(orderBy).toHaveBeenCalled();
    });

    it('finds by id and by code', async () => {
        const { db } = createDatabase();
        const repository = new CoursesRepository(db as never);
        await expect(repository.findById(ID)).resolves.toBe(course);
        await expect(repository.findByCode('CS-101')).resolves.toBe(course);
    });

    it('throws not-found for missing id or code', async () => {
        const { db, limit } = createDatabase();
        limit.mockResolvedValue([]);
        const repository = new CoursesRepository(db as never);
        await expect(repository.findById(ID)).rejects.toEqual(CourseNotFound(ID));
        await expect(repository.findByCode('CS-101')).rejects.toEqual(CourseNotFound('CS-101'));
    });

    it('updates fields and refreshes updatedAt', async () => {
        const { db } = createDatabase();
        await expect(new CoursesRepository(db as never).update(ID, { name: 'Updated' })).resolves.toBe(course);
        expect(db.update().set).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated', updatedAt: expect.any(Date) }));
    });

    it('throws not-found when update returns no row', async () => {
        const { db, returning } = createDatabase();
        returning.mockResolvedValue([]);
        await expect(new CoursesRepository(db as never).update(ID, {})).rejects.toEqual(CourseNotFound(ID));
    });

    it('deletes existing courses and rejects missing courses', async () => {
        const { db, where } = createDatabase();
        where.mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: ID }]) });
        await expect(new CoursesRepository(db as never).delete(ID)).resolves.toBeUndefined();

        const missing = createDatabase();
        missing.where.mockReturnValue({ returning: jest.fn().mockResolvedValue([]) });
        await expect(new CoursesRepository(missing.db as never).delete(ID)).rejects.toEqual(CourseNotFound(ID));
    });

    it('propagates read, update, and delete errors', async () => {
        const read = createDatabase();
        read.db.select.mockImplementation(() => {
            throw new Error('select failed');
        });
        await expect(new CoursesRepository(read.db as never).findAll()).rejects.toThrow('select failed');

        const update = createDatabase();
        update.db.update.mockImplementation(() => {
            throw new Error('update failed');
        });
        await expect(new CoursesRepository(update.db as never).update(ID, {})).rejects.toThrow('update failed');

        const remove = createDatabase();
        remove.db.delete.mockImplementation(() => {
            throw new Error('delete failed');
        });
        await expect(new CoursesRepository(remove.db as never).delete(ID)).rejects.toThrow('delete failed');
    });
});
