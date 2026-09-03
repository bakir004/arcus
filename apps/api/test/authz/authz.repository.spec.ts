import { AuthzRepository } from '@/authz/authz.repository';
import { Permissions } from '@/authz/permissions';

const USER_ID = 'user-1';
const COURSE_ID = '11111111-1111-4111-8111-111111111111';

function createDatabase(rows: Array<{ role: string; permission: string }> = []) {
    const query = {
        from: jest.fn(),
        innerJoin: jest.fn(),
        where: jest.fn().mockResolvedValue(rows),
    };
    query.from.mockReturnValue(query);
    query.innerJoin.mockReturnValue(query);
    const db = { select: jest.fn().mockReturnValue(query) };
    return { db, query };
}

describe('AuthzRepository', () => {
    it('returns no permissions for a faculty scope', async () => {
        const { db } = createDatabase();
        const repository = new AuthzRepository(db as never);

        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'faculty',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead],
        })).resolves.toEqual([]);
        expect(db.select).not.toHaveBeenCalled();
    });

    it('returns no permissions without querying when none are requested', async () => {
        const { db } = createDatabase();
        const repository = new AuthzRepository(db as never);

        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [],
        })).resolves.toEqual([]);
        expect(db.select).not.toHaveBeenCalled();
    });

    it('deduplicates permissions returned for a course', async () => {
        const { db } = createDatabase([
            { role: 'Professor', permission: Permissions.ExamRead },
            { role: 'Professor', permission: Permissions.ExamRead },
            { role: 'Professor', permission: Permissions.ExamUpdate },
        ]);
        const repository = new AuthzRepository(db as never);

        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead, Permissions.ExamUpdate],
        })).resolves.toEqual([Permissions.ExamRead, Permissions.ExamUpdate]);
    });

    it('returns unique sorted roles and permissions for a user', async () => {
        const { db } = createDatabase([
            { role: 'Student', permission: Permissions.ExamRead },
            { role: 'Professor', permission: Permissions.ExamUpdate },
            { role: 'Student', permission: Permissions.ExamRead },
            { role: 'Professor', permission: Permissions.ExamRead },
        ]);
        const repository = new AuthzRepository(db as never);

        await expect(repository.getUserAuthzContext(USER_ID)).resolves.toEqual({
            roles: ['Professor', 'Student'],
            permissions: [Permissions.ExamRead, Permissions.ExamUpdate],
        });
    });

    it('returns an empty context when a user has no memberships', async () => {
        const { db } = createDatabase();
        await expect(new AuthzRepository(db as never).getUserAuthzContext(USER_ID)).resolves.toEqual({
            roles: [],
            permissions: [],
        });
    });

    it('returns a course-specific unique sorted context', async () => {
        const { db } = createDatabase([
            { role: 'Teacher', permission: Permissions.ExamUpdate },
            { role: 'Assistant', permission: Permissions.ExamRead },
            { role: 'Teacher', permission: Permissions.ExamUpdate },
        ]);
        await expect(new AuthzRepository(db as never).getCourseAuthzContext(USER_ID, COURSE_ID)).resolves.toEqual({
            roles: ['Assistant', 'Teacher'],
            permissions: [Permissions.ExamRead, Permissions.ExamUpdate],
        });
    });

    it('propagates database failures from every query', async () => {
        const { db } = createDatabase();
        const failure = new Error('database unavailable');
        db.select.mockImplementation(() => {
            throw failure;
        });
        const repository = new AuthzRepository(db as never);

        await expect(repository.getPermissions({
            userId: USER_ID,
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: [Permissions.ExamRead],
        })).rejects.toBe(failure);
        await expect(repository.getUserAuthzContext(USER_ID)).rejects.toBe(failure);
        await expect(repository.getCourseAuthzContext(USER_ID, COURSE_ID)).rejects.toBe(failure);
    });
});
