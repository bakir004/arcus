import { eq } from 'drizzle-orm';
import { openExamTestDatabase } from '../../../helpers/test-database';
import { courses, user } from '@/database/schema';
import { CoursesRepository } from '@/modules/courses/courses/courses.repository';
import { CourseNotFound } from '@/modules/courses/courses/courses.errors';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'course-integration-user';
const OTHER_USER_ID = 'course-other-user';
const baseData = { name: 'Algorithms', code: 'CS-101', facultyId: null };

describe('CoursesRepository PostgreSQL integration', () => {
    let context: Awaited<ReturnType<typeof openExamTestDatabase>>;
    let repository: CoursesRepository;

    beforeAll(async () => {
        context = await openExamTestDatabase();
        repository = new CoursesRepository(context.database as never);
        const now = new Date();
        await context.database.insert(user).values([
            { id: USER_ID, name: 'Course User', email: 'course-user@example.com', emailVerified: true, createdAt: now, updatedAt: now },
            { id: OTHER_USER_ID, name: 'Other User', email: 'other-course-user@example.com', emailVerified: true, createdAt: now, updatedAt: now },
        ]);
    }, 30_000);

    beforeEach(async () => {
        await context.database.delete(courses);
    });

    afterAll(async () => {
        await context?.close();
    });

    it('creates and reads a persisted course', async () => {
        const created = await repository.create(USER_ID, baseData);
        expect(created.id).toEqual(expect.any(String));
        expect(created.createdById).toBe(USER_ID);
        expect(created.createdAt).toBeInstanceOf(Date);
        await expect(context.database.select().from(courses).where(eq(courses.id, created.id))).resolves.toHaveLength(1);
    });

    it('lists courses alphabetically and returns an empty list when empty', async () => {
        await expect(repository.findAll()).resolves.toEqual([]);
        await context.database.insert(courses).values([
            { id: SECOND_ID, name: 'Zoology', code: 'BIO-1', createdById: USER_ID },
            { id: COURSE_ID, name: 'Algorithms', code: 'CS-101', createdById: USER_ID },
        ]);
        await expect(repository.findAll()).resolves.toMatchObject([{ id: COURSE_ID }, { id: SECOND_ID }]);
    });

    it('finds courses by id and code', async () => {
        await context.database.insert(courses).values({ id: COURSE_ID, ...baseData, createdById: USER_ID });
        await expect(repository.findById(COURSE_ID)).resolves.toMatchObject({ id: COURSE_ID, code: 'CS-101' });
        await expect(repository.findByCode('CS-101')).resolves.toMatchObject({ id: COURSE_ID });
    });

    it('reports missing id and code lookups', async () => {
        await expect(repository.findById(COURSE_ID)).rejects.toEqual(CourseNotFound(COURSE_ID));
        await expect(repository.findByCode('MISSING')).rejects.toEqual(CourseNotFound('MISSING'));
    });

    it('updates fields and refreshes updatedAt', async () => {
        const oldDate = new Date(Date.now() - 60_000);
        await context.database.insert(courses).values({ id: COURSE_ID, ...baseData, createdById: USER_ID, updatedAt: oldDate });
        const updated = await repository.update(COURSE_ID, { name: 'Updated', code: null });
        expect(updated).toMatchObject({ id: COURSE_ID, name: 'Updated', code: null });
        expect(updated.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('rejects missing updates and deletes', async () => {
        await expect(repository.update(COURSE_ID, { name: 'Missing' })).rejects.toEqual(CourseNotFound(COURSE_ID));
        await expect(repository.delete(COURSE_ID)).rejects.toEqual(CourseNotFound(COURSE_ID));
    });

    it('deletes a persisted course', async () => {
        await context.database.insert(courses).values({ id: COURSE_ID, ...baseData, createdById: USER_ID });
        await expect(repository.delete(COURSE_ID)).resolves.toBeUndefined();
        await expect(context.database.select().from(courses).where(eq(courses.id, COURSE_ID))).resolves.toHaveLength(0);
    });

    it('enforces the creator foreign key', async () => {
        await expect(repository.create('missing-user', baseData)).rejects.toThrow();
    });

    it('isolates courses created by different users without filtering them out', async () => {
        await repository.create(USER_ID, { ...baseData, name: 'User one course', code: 'ONE' });
        await repository.create(OTHER_USER_ID, { ...baseData, name: 'User two course', code: 'TWO' });
        await expect(repository.findAll()).resolves.toHaveLength(2);
    });
});
