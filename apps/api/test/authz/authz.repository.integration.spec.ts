import { AuthzRepository } from '@/authz/authz.repository';
import { Permissions } from '@/authz/permissions';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles, courses, user } from '@/database/schema';
import { openExamTestDatabase } from '../helpers/test-database';

const USER_ID = 'authz-integration-user';
const OTHER_USER_ID = 'authz-integration-other';
const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '55555555-5555-4555-8555-555555555555';
const OTHER_MEMBER_ID = '66666666-6666-4666-8666-666666666666';
const ROLE_ID = '77777777-7777-4777-8777-777777777777';
const SECOND_ROLE_ID = '88888888-8888-4888-8888-888888888888';
const OTHER_ROLE_ID = '99999999-9999-4999-8999-999999999999';

describe('AuthzRepository PostgreSQL integration', () => {
    let context: Awaited<ReturnType<typeof openExamTestDatabase>>;
    let repository: AuthzRepository;

    beforeAll(async () => {
        context = await openExamTestDatabase();
        const now = new Date();
        await context.database.insert(user).values([
            { id: USER_ID, name: 'Authz User', email: 'authz@example.com', emailVerified: true, createdAt: now, updatedAt: now },
            { id: OTHER_USER_ID, name: 'Other User', email: 'authz-other@example.com', emailVerified: true, createdAt: now, updatedAt: now },
        ]);
        await context.database.insert(courses).values([
            { id: COURSE_ID, name: 'Authz Course', code: 'AUTHZ', createdById: USER_ID },
            { id: OTHER_COURSE_ID, name: 'Other Course', code: 'AUTHZ-OTHER', createdById: USER_ID },
        ]);
        await context.database.insert(courseRoles).values([
            { id: ROLE_ID, courseId: COURSE_ID, name: 'z-teacher', createdById: USER_ID },
            { id: SECOND_ROLE_ID, courseId: COURSE_ID, name: 'a-assistant', createdById: USER_ID },
            { id: OTHER_ROLE_ID, courseId: OTHER_COURSE_ID, name: 'other-teacher', createdById: USER_ID },
        ]);
        await context.database.insert(courseMembers).values([
            { id: MEMBER_ID, courseId: COURSE_ID, userId: USER_ID },
            { id: OTHER_MEMBER_ID, courseId: OTHER_COURSE_ID, userId: USER_ID },
        ]);
        await context.database.insert(courseMemberRoles).values([
            { courseMemberId: MEMBER_ID, courseRoleId: ROLE_ID },
            { courseMemberId: MEMBER_ID, courseRoleId: SECOND_ROLE_ID },
            { courseMemberId: OTHER_MEMBER_ID, courseRoleId: OTHER_ROLE_ID },
        ]);
        await context.database.insert(courseRolePermissions).values([
            { courseRoleId: ROLE_ID, permissionKey: Permissions.ExamUpdate },
            { courseRoleId: ROLE_ID, permissionKey: Permissions.ExamRead },
            { courseRoleId: SECOND_ROLE_ID, permissionKey: Permissions.ExamRead },
            { courseRoleId: SECOND_ROLE_ID, permissionKey: Permissions.CourseRead },
            { courseRoleId: OTHER_ROLE_ID, permissionKey: Permissions.ExamDelete },
        ]);
        repository = new AuthzRepository(context.database);
    }, 30_000);

    afterAll(async () => {
        await context?.close();
    });

    it('resolves requested course permissions and removes duplicate results', async () => {
        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead, Permissions.ExamUpdate, Permissions.ExamDelete],
        })).resolves.toEqual(expect.arrayContaining([Permissions.ExamRead, Permissions.ExamUpdate]));
        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead, Permissions.ExamUpdate, Permissions.ExamDelete],
        })).resolves.toHaveLength(2);
    });

    it('does not leak permissions from another course', async () => {
        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamDelete],
        })).resolves.toEqual([]);
        await expect(repository.getCourseAuthzContext(USER_ID, COURSE_ID)).resolves.toEqual({
            roles: ['a-assistant', 'z-teacher'],
            permissions: [Permissions.CourseRead, Permissions.ExamRead, Permissions.ExamUpdate],
        });
    });

    it('resolves all contexts for a user and returns an empty context for an unknown user', async () => {
        await expect(repository.getUserAuthzContext(USER_ID)).resolves.toEqual({
            roles: ['a-assistant', 'other-teacher', 'z-teacher'],
            permissions: [Permissions.CourseRead, Permissions.ExamDelete, Permissions.ExamRead, Permissions.ExamUpdate],
        });
        await expect(repository.getUserAuthzContext(OTHER_USER_ID)).resolves.toEqual({ roles: [], permissions: [] });
    });

    it('returns empty results for faculty scope and no requested permissions', async () => {
        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'faculty',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead],
        })).resolves.toEqual([]);
        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [],
        })).resolves.toEqual([]);
    });
});
