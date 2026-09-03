import type { NextFunction, Request, Response } from 'express';

// Keep the test on Jest's CommonJS path while preserving the package's real
// parameter-decorator behavior against the request session.
jest.mock('@thallesp/nestjs-better-auth', () => {
    const { createParamDecorator } = jest.requireActual('@nestjs/common');
    return {
        Session: createParamDecorator((_data: unknown, context: { switchToHttp: () => { getRequest: () => SessionRequest } }) =>
            context.switchToHttp().getRequest().session,
        ),
    };
});

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { ExamsModule } from '@/modules/exams/exams/exams.module';
import { DATABASE } from '@/database/database.module';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles, courses, exams, user } from '@/database/schema';
import { Permissions } from '@/authz/permissions';
import { ExamType, ExamVisibility } from '@/database/schema';
import { HttpExceptionFilter } from '@/common/exception.filter';
import { openExamTestDatabase } from '../../../helpers/test-database';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '33333333-3333-4333-8333-333333333333';
const ROLE_ID = '44444444-4444-4444-8444-444444444444';
const MEMBER_ID = '55555555-5555-4555-8555-555555555555';
const LIMITED_MEMBER_ID = '66666666-6666-4666-8666-666666666666';
const OTHER_ROLE_ID = '77777777-7777-4777-8777-777777777777';
const OTHER_MEMBER_ID = '88888888-8888-4888-8888-888888888888';
const USER_ID = 'exam-e2e-user';
const LIMITED_USER_ID = 'exam-e2e-limited-user';

const validPayload = {
    title: 'HTTP Midterm',
    description: 'Exam over HTTP',
    type: ExamType.Online,
    durationMinutes: 90,
    maxAttempts: 2,
    visibility: ExamVisibility.Draft,
};

type SessionRequest = Request & { session?: { user: { id: string } } };

describe('Exams HTTP API (end-to-end)', () => {
    let app: INestApplication;
    let context: Awaited<ReturnType<typeof openExamTestDatabase>>;

    beforeAll(async () => {
        context = await openExamTestDatabase();
        const now = new Date();
        await context.database.insert(user).values([
            {
                id: USER_ID,
                name: 'Exam E2E User',
                email: 'exam-e2e@example.com',
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: LIMITED_USER_ID,
                name: 'Limited E2E User',
                email: 'exam-e2e-limited@example.com',
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            },
        ]);
        await context.database.insert(courses).values([
            { id: COURSE_ID, name: 'E2E course', code: 'EXAM-E2E', createdById: USER_ID },
            { id: OTHER_COURSE_ID, name: 'Other E2E course', code: 'OTHER-E2E', createdById: USER_ID },
        ]);
        await context.database.insert(courseRoles).values([
            {
                id: ROLE_ID,
                courseId: COURSE_ID,
                name: 'Exam administrator',
                createdById: USER_ID,
            },
            {
                id: OTHER_ROLE_ID,
                courseId: OTHER_COURSE_ID,
                name: 'Other course exam administrator',
                createdById: USER_ID,
            },
        ]);
        await context.database.insert(courseMembers).values([
            { id: MEMBER_ID, courseId: COURSE_ID, userId: USER_ID },
            { id: OTHER_MEMBER_ID, courseId: OTHER_COURSE_ID, userId: USER_ID },
            { id: LIMITED_MEMBER_ID, courseId: COURSE_ID, userId: LIMITED_USER_ID },
        ]);
        await context.database.insert(courseMemberRoles).values([
            { courseMemberId: MEMBER_ID, courseRoleId: ROLE_ID },
            { courseMemberId: OTHER_MEMBER_ID, courseRoleId: OTHER_ROLE_ID },
        ]);
        await context.database.insert(courseRolePermissions).values(
            [ROLE_ID, OTHER_ROLE_ID].flatMap((courseRoleId) =>
                [Permissions.ExamCreate, Permissions.ExamRead, Permissions.ExamUpdate, Permissions.ExamDelete].map((permissionKey) => ({
                    courseRoleId,
                    permissionKey,
                })),
            ),
        );

        const moduleRef = await Test.createTestingModule({ imports: [ExamsModule] })
            .overrideProvider(DATABASE)
            .useValue(context.database)
            .compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalFilters(new HttpExceptionFilter());
        // The real PermissionsGuard remains installed by ExamsModule. This middleware
        // represents the authenticated request produced by the auth adapter, while
        // authorization is resolved from the real isolated database tables.
        app.use((req: SessionRequest, _res: Response, next: NextFunction) => {
            if (req.headers['x-test-session'] === 'valid') req.session = { user: { id: USER_ID } };
            if (req.headers['x-test-session'] === 'limited') req.session = { user: { id: LIMITED_USER_ID } };
            next();
        });
        await app.init();
    }, 30_000);

    beforeEach(async () => {
        await context.database.delete(exams);
    });

    afterAll(async () => {
        await app?.close();
        await context?.close();
    });

    const authenticated = (test: request.Test, session = 'valid') => test.set('x-test-session', session);

    it('rejects anonymous requests through the real permissions guard', async () => {
        await request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/exams`).expect(401);
    });

    it('creates an exam through the real service and repository', async () => {
        const response = await authenticated(
            request(app.getHttpServer()).post(`/api/courses/${COURSE_ID}/exams`).send(validPayload),
        ).expect(201);

        expect(response.body).toMatchObject({
            courseId: COURSE_ID,
            createdById: USER_ID,
            title: validPayload.title,
            type: validPayload.type,
        });
        const rows = await context.database.select().from(exams).where(eq(exams.id, response.body.id));
        expect(rows).toHaveLength(1);
    });

    it('lists and retrieves persisted exams', async () => {
        await authenticated(request(app.getHttpServer()).post(`/api/courses/${COURSE_ID}/exams`).send(validPayload)).expect(201);
        const list = await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/exams`)).expect(200);
        expect(list.body).toHaveLength(1);
        const one = await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/exams/${list.body[0].id}`)).expect(200);
        expect(one.body.title).toBe(validPayload.title);
    });

    it('updates and deletes through the real repository', async () => {
        const created = await authenticated(
            request(app.getHttpServer()).post(`/api/courses/${COURSE_ID}/exams`).send(validPayload),
        ).expect(201);
        const updated = await authenticated(
            request(app.getHttpServer()).patch(`/api/courses/${COURSE_ID}/exams/${created.body.id}`).send({ title: 'Final' }),
        ).expect(200);
        expect(updated.body.title).toBe('Final');
        await authenticated(request(app.getHttpServer()).delete(`/api/courses/${COURSE_ID}/exams/${created.body.id}`)).expect(204);
        await expect(context.database.select().from(exams).where(eq(exams.id, created.body.id))).resolves.toHaveLength(0);
    });

    it('returns 403 for an authenticated user without the required permission', async () => {
        await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/exams`), 'limited').expect(403);
    });

    it('enforces course scoping for reads, updates, and deletes', async () => {
        const created = await authenticated(
            request(app.getHttpServer()).post(`/api/courses/${COURSE_ID}/exams`).send(validPayload),
        ).expect(201);
        await authenticated(request(app.getHttpServer()).get(`/api/courses/${OTHER_COURSE_ID}/exams/${created.body.id}`)).expect(404);
        await authenticated(
            request(app.getHttpServer()).patch(`/api/courses/${OTHER_COURSE_ID}/exams/${created.body.id}`).send({ title: 'Wrong course' }),
        ).expect(404);
        await authenticated(request(app.getHttpServer()).delete(`/api/courses/${OTHER_COURSE_ID}/exams/${created.body.id}`)).expect(404);
        await expect(context.database.select().from(exams).where(eq(exams.id, created.body.id))).resolves.toHaveLength(1);
    });

    it.each([
        ['invalid course id', 'get', '/api/courses/nope/exams'],
        ['invalid exam id', 'get', `/api/courses/${COURSE_ID}/exams/nope`],
        ['invalid update exam id', 'patch', `/api/courses/${COURSE_ID}/exams/nope`],
        ['invalid delete exam id', 'delete', `/api/courses/${COURSE_ID}/exams/nope`],
    ])('rejects %s with 400', async (_name, method, path) => {
        const test = request(app.getHttpServer())[method as 'get' | 'patch' | 'delete'](path);
        await authenticated(test).send(method === 'patch' ? { title: 'x' } : undefined).expect(400);
    });

    it('rejects invalid create data before persistence', async () => {
        await authenticated(
            request(app.getHttpServer()).post(`/api/courses/${COURSE_ID}/exams`).send({ ...validPayload, title: '', durationMinutes: 0 }),
        ).expect(400);
        await expect(context.database.select().from(exams)).resolves.toHaveLength(0);
    });
});
