import { eq } from 'drizzle-orm';
import { openExamTestDatabase } from '../../../helpers/test-database';
import { ExamsRepository } from '@/modules/exams/exams/exams.repository';
import { ExamNotFound } from '@/modules/exams/exams/exams.errors';
import { courses, exams, user } from '@/database/schema';
import { ExamType, ExamVisibility } from '@/database/schema';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '33333333-3333-4333-8333-333333333333';
const EXAM_ID = '22222222-2222-4222-8222-222222222222';
const EARLY_ID = '44444444-4444-4444-8444-444444444444';
const LATE_ID = '55555555-5555-4555-8555-555555555555';
const USER_ID = 'exam-integration-user';
const baseData = {
    title: 'Integration exam',
    description: null,
    type: ExamType.Written,
    durationMinutes: 60,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
};

describe('ExamsRepository PostgreSQL integration', () => {
    let context: Awaited<ReturnType<typeof openExamTestDatabase>>;
    let repository: ExamsRepository;

    beforeAll(async () => {
        context = await openExamTestDatabase();
        repository = new ExamsRepository(context.database as never);
        const now = new Date();
        await context.database.insert(user).values({
            id: USER_ID,
            name: 'Exam Integration User',
            email: 'exam-integration@example.com',
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
        });
        await context.database.insert(courses).values([
            { id: COURSE_ID, name: 'Exam course', code: 'EXAM-INT', createdById: USER_ID },
            { id: OTHER_COURSE_ID, name: 'Other course', code: 'OTHER-INT', createdById: USER_ID },
        ]);
    }, 30_000);

    beforeEach(async () => {
        await context.database.delete(exams);
    });

    afterAll(async () => {
        await context?.close();
    });

    it('creates and reads a persisted exam', async () => {
        const created = await repository.create(COURSE_ID, USER_ID, baseData);
        expect(created.id).toEqual(expect.any(String));
        expect(created.courseId).toBe(COURSE_ID);
        expect(created.createdById).toBe(USER_ID);
        expect(created.createdAt).toBeInstanceOf(Date);
        const rows = await context.database.select().from(exams).where(eq(exams.id, created.id));
        expect(rows).toHaveLength(1);
        expect(rows[0]?.title).toBe('Integration exam');
    });

    it('lists only the requested course and orders by creation time', async () => {
        await context.database.insert(exams).values([
            {
                id: LATE_ID,
                courseId: COURSE_ID,
                createdById: USER_ID,
                ...baseData,
                title: 'Later',
                createdAt: new Date('2026-01-02T00:00:00Z'),
            },
            {
                id: EARLY_ID,
                courseId: COURSE_ID,
                createdById: USER_ID,
                ...baseData,
                title: 'Earlier',
                createdAt: new Date('2026-01-01T00:00:00Z'),
            },
            {
                courseId: OTHER_COURSE_ID,
                createdById: USER_ID,
                ...baseData,
                title: 'Not included',
            },
        ]);
        const result = await repository.findAll(COURSE_ID);
        expect(result.map((value) => value.id)).toEqual([EARLY_ID, LATE_ID]);
    });

    it('finds by both course and exam id', async () => {
        await context.database.insert(exams).values({ id: EXAM_ID, courseId: COURSE_ID, createdById: USER_ID, ...baseData });
        await expect(repository.findById(COURSE_ID, EXAM_ID)).resolves.toMatchObject({ id: EXAM_ID });
        await expect(repository.findById(OTHER_COURSE_ID, EXAM_ID)).rejects.toEqual(ExamNotFound(EXAM_ID));
    });

    it('updates persisted fields and refreshes updatedAt', async () => {
        const oldDate = new Date(Date.now() - 60_000);
        await context.database.insert(exams).values({
            id: EXAM_ID,
            courseId: COURSE_ID,
            createdById: USER_ID,
            ...baseData,
            updatedAt: oldDate,
        });
        const updated = await repository.update(COURSE_ID, EXAM_ID, {
            title: 'Updated exam',
            description: 'A description',
            type: ExamType.Online,
            durationMinutes: 90,
            maxAttempts: 3,
            visibility: ExamVisibility.Published,
        });
        expect(updated).toMatchObject({
            title: 'Updated exam',
            description: 'A description',
            type: ExamType.Online,
            durationMinutes: 90,
            maxAttempts: 3,
            visibility: ExamVisibility.Published,
        });
        expect(updated.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('reports missing update and delete targets', async () => {
        await expect(repository.update(COURSE_ID, EXAM_ID, { title: 'Missing' })).rejects.toEqual(ExamNotFound(EXAM_ID));
        await expect(repository.delete(COURSE_ID, EXAM_ID)).rejects.toEqual(ExamNotFound(EXAM_ID));
    });

    it('does not update an exam through the wrong course', async () => {
        await context.database.insert(exams).values({ id: EXAM_ID, courseId: COURSE_ID, createdById: USER_ID, ...baseData });
        await expect(repository.update(OTHER_COURSE_ID, EXAM_ID, { title: 'Must not update' })).rejects.toEqual(ExamNotFound(EXAM_ID));
        await expect(repository.findById(COURSE_ID, EXAM_ID)).resolves.toMatchObject({ title: baseData.title });
    });

    it('does not delete an exam through the wrong course', async () => {
        await context.database.insert(exams).values({ id: EXAM_ID, courseId: COURSE_ID, createdById: USER_ID, ...baseData });
        await expect(repository.delete(OTHER_COURSE_ID, EXAM_ID)).rejects.toEqual(ExamNotFound(EXAM_ID));
        await expect(repository.findById(COURSE_ID, EXAM_ID)).resolves.toMatchObject({ id: EXAM_ID });
    });

    it('deletes an existing exam and verifies the database row is gone', async () => {
        await context.database.insert(exams).values({ id: EXAM_ID, courseId: COURSE_ID, createdById: USER_ID, ...baseData });
        await expect(repository.delete(COURSE_ID, EXAM_ID)).resolves.toBeUndefined();
        await expect(repository.findById(COURSE_ID, EXAM_ID)).rejects.toEqual(ExamNotFound(EXAM_ID));
    });

    it('enforces foreign-key ownership relationships', async () => {
        await expect(repository.create(COURSE_ID, 'missing-user', baseData)).rejects.toThrow();
        await expect(repository.create('66666666-6666-4666-8666-666666666666', USER_ID, baseData)).rejects.toThrow();
    });
});
