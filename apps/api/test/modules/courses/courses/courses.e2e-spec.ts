import type { NextFunction, Request, Response } from 'express';

jest.mock('@thallesp/nestjs-better-auth', () => {
    const { createParamDecorator } = jest.requireActual('@nestjs/common');
    return {
        OptionalAuth: () => () => undefined,
        Session: createParamDecorator((_data: unknown, context: { switchToHttp: () => { getRequest: () => SessionRequest } }) =>
            context.switchToHttp().getRequest().session),
    };
});

import { CanActivate, ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { CoursesModule } from '@/modules/courses/courses/courses.module';
import { DATABASE } from '@/database/database.module';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles, courses, user } from '@/database/schema';
import { Permissions } from '@/authz/permissions';
import { HttpExceptionFilter } from '@/common/exception.filter';
import { openExamTestDatabase } from '../../../helpers/test-database';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '22222222-2222-4222-8222-222222222222';
const ROLE_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_ROLE_ID = '66666666-6666-4666-8666-666666666666';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_MEMBER_ID = '77777777-7777-4777-8777-777777777777';
const LIMITED_MEMBER_ID = '55555555-5555-4555-8555-555555555555';
const USER_ID = 'course-e2e-user';
const LIMITED_USER_ID = 'course-e2e-limited-user';

const validPayload = { name: 'Algorithms', code: 'CS-101', facultyId: null };

type SessionRequest = Request & { session?: { user: { id: string; name?: string; email?: string; image?: string | null } } | null };

class TestAuthenticationGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<SessionRequest>();
        const token = request.headers['x-test-session'];
        if (!token && request.path.endsWith('/me')) return true;
        if (token !== 'valid' && token !== 'limited') throw new UnauthorizedException();
        const userId = token === 'limited' ? LIMITED_USER_ID : USER_ID;
        request.session = { user: { id: userId, name: 'E2E User', email: 'e2e@example.com', image: null } };
        return true;
    }
}

describe('Courses HTTP API (end-to-end)', () => {
    let app: INestApplication;
    let context: Awaited<ReturnType<typeof openExamTestDatabase>>;

    beforeAll(async () => {
        context = await openExamTestDatabase();
        const now = new Date();
        await context.database.insert(user).values([
            { id: USER_ID, name: 'Course E2E User', email: 'course-e2e@example.com', emailVerified: true, createdAt: now, updatedAt: now },
            { id: LIMITED_USER_ID, name: 'Limited E2E User', email: 'limited-course-e2e@example.com', emailVerified: true, createdAt: now, updatedAt: now },
        ]);
        const moduleRef = await Test.createTestingModule({ imports: [CoursesModule] })
            .overrideProvider(DATABASE)
            .useValue(context.database)
            .compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalFilters(new HttpExceptionFilter());
        app.useGlobalGuards(new TestAuthenticationGuard());
        app.use((_req: Request, _res: Response, next: NextFunction) => next());
        await app.init();
    }, 30_000);

    beforeEach(async () => {
        await context.database.delete(courses);
        await context.database.insert(courses).values([
            { id: COURSE_ID, name: 'Algorithms', code: 'CS-101', createdById: USER_ID },
            { id: OTHER_COURSE_ID, name: 'Other course', code: 'CS-102', createdById: USER_ID },
        ]);
        await context.database.insert(courseRoles).values([
            { id: ROLE_ID, courseId: COURSE_ID, name: 'Instructor', createdById: USER_ID },
            { id: OTHER_ROLE_ID, courseId: OTHER_COURSE_ID, name: 'Other Instructor', createdById: USER_ID },
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
            [ROLE_ID, OTHER_ROLE_ID].flatMap((courseRoleId) => [Permissions.CourseRead, Permissions.CourseManage].map((permissionKey) => ({ courseRoleId, permissionKey }))),
        );
    });

    afterAll(async () => {
        await app?.close();
        await context?.close();
    });

    const authenticated = (test: request.Test, session = 'valid') => test.set('x-test-session', session);

    it('returns explicit JSON null for anonymous course membership', async () => {
        const response = await request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/me`).expect(200);
        expect(response.body).toBeNull();
    });

    it('rejects unauthenticated non-optional course requests', async () => {
        await request(app.getHttpServer()).post('/api/courses').send(validPayload).expect(401);
        await request(app.getHttpServer()).get('/api/courses').expect(401);
        await request(app.getHttpServer()).get('/api/courses/code/CS-101').expect(401);
        await request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}`).expect(401);
        await request(app.getHttpServer()).patch(`/api/courses/${COURSE_ID}`).send({ name: 'x' }).expect(401);
        await request(app.getHttpServer()).delete(`/api/courses/${COURSE_ID}`).expect(401);
    });

    it('creates and lists persisted courses', async () => {
        const created = await authenticated(request(app.getHttpServer()).post('/api/courses')).send({ name: 'Databases', code: 'CS-201' }).expect(201);
        expect(created.body).toMatchObject({ name: 'Databases', code: 'CS-201', createdById: USER_ID });
        const rows = await context.database.select().from(courses).where(eq(courses.id, created.body.id));
        expect(rows).toHaveLength(1);
        const list = await authenticated(request(app.getHttpServer()).get('/api/courses')).expect(200);
        expect(list.body.map((course: { name: string }) => course.name)).toEqual(['Algorithms', 'Databases', 'Other course']);
    });

    it('gets by id and code, updates, and deletes with authorization', async () => {
        const byId = await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}`)).expect(200);
        expect(byId.body).toMatchObject({ id: COURSE_ID, name: 'Algorithms', createdById: USER_ID });
        const byCode = await authenticated(request(app.getHttpServer()).get('/api/courses/code/CS-101')).expect(200);
        expect(byCode.body.id).toBe(COURSE_ID);
        const updated = await authenticated(request(app.getHttpServer()).patch(`/api/courses/${COURSE_ID}`).send({ name: 'Advanced Algorithms' })).expect(200);
        expect(updated.body.name).toBe('Advanced Algorithms');
        await authenticated(request(app.getHttpServer()).delete(`/api/courses/${OTHER_COURSE_ID}`)).expect(204);
        await expect(context.database.select().from(courses).where(eq(courses.id, OTHER_COURSE_ID))).resolves.toHaveLength(0);
    });

    it('returns membership, roles, and permissions for authorized users', async () => {
        const response = await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}/me`)).expect(200);
        expect(response.body).toMatchObject({
            user: { id: USER_ID },
            roles: ['Instructor'],
            permissions: [Permissions.CourseManage, Permissions.CourseRead],
        });
    });

    it('returns 403 for authenticated users without course permissions', async () => {
        await authenticated(request(app.getHttpServer()).get(`/api/courses/${COURSE_ID}`), 'limited').expect(403);
        await authenticated(request(app.getHttpServer()).patch(`/api/courses/${COURSE_ID}`).send({ name: 'Nope' }), 'limited').expect(403);
        await authenticated(request(app.getHttpServer()).delete(`/api/courses/${COURSE_ID}`), 'limited').expect(403);
    });

    it('returns 404 for missing courses and missing codes', async () => {
        await authenticated(request(app.getHttpServer()).get(`/api/courses/${'66666666-6666-4666-8666-666666666666'}`)).expect(403);
        await authenticated(request(app.getHttpServer()).get('/api/courses/code/MISSING')).expect(404);
        await authenticated(request(app.getHttpServer()).get(`/api/courses/${'66666666-6666-4666-8666-666666666666'}/me`)).expect(404);
    });

    it('returns 400 for malformed UUIDs and invalid payloads', async () => {
        await authenticated(request(app.getHttpServer()).get('/api/courses/not-a-uuid')).expect(400);
        await authenticated(request(app.getHttpServer()).patch(`/api/courses/${COURSE_ID}`).send({ facultyId: 'bad' })).expect(400);
        await authenticated(request(app.getHttpServer()).post('/api/courses').send({ name: '', code: '' })).expect(400);
        await expect(context.database.select().from(courses)).resolves.toHaveLength(2);
    });
});
