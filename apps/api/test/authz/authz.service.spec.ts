import { AuthzRepository } from '@/authz/authz.repository';
import { AuthzService } from '@/authz/authz.service';
import { Permissions } from '@/authz/permissions';

const query = {
    userId: 'user-1',
    scope: 'course' as const,
    scopeId: '11111111-1111-4111-8111-111111111111',
    permissions: [Permissions.ExamRead],
};

describe('AuthzService', () => {
    it('delegates permission queries', async () => {
        const repository = { getPermissions: jest.fn().mockResolvedValue([Permissions.ExamRead]) };
        const service = new AuthzService(repository as unknown as AuthzRepository);

        await expect(service.getPermissions(query)).resolves.toEqual([Permissions.ExamRead]);
        expect(repository.getPermissions).toHaveBeenCalledWith(query);
    });

    it('reports whether any permission was granted', async () => {
        const repository = { getPermissions: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([Permissions.ExamRead]) };
        const service = new AuthzService(repository as unknown as AuthzRepository);

        await expect(service.hasAnyPermission(query)).resolves.toBe(false);
        await expect(service.hasAnyPermission(query)).resolves.toBe(true);
    });

    it('delegates user and course context queries', async () => {
        const context = { roles: ['Professor'], permissions: [Permissions.ExamRead] };
        const repository = {
            getPermissions: jest.fn(),
            getUserAuthzContext: jest.fn().mockResolvedValue(context),
            getCourseAuthzContext: jest.fn().mockResolvedValue(context),
        };
        const service = new AuthzService(repository as unknown as AuthzRepository);

        await expect(service.getUserAuthzContext('user-1')).resolves.toBe(context);
        await expect(service.getCourseAuthzContext('user-1', query.scopeId)).resolves.toBe(context);
        expect(repository.getUserAuthzContext).toHaveBeenCalledWith('user-1');
        expect(repository.getCourseAuthzContext).toHaveBeenCalledWith('user-1', query.scopeId);
    });

    it('propagates repository failures', async () => {
        const failure = new Error('database failed');
        const repository = {
            getPermissions: jest.fn().mockRejectedValue(failure),
            getUserAuthzContext: jest.fn().mockRejectedValue(failure),
            getCourseAuthzContext: jest.fn().mockRejectedValue(failure),
        };
        const service = new AuthzService(repository as unknown as AuthzRepository);

        await expect(service.getPermissions(query)).rejects.toBe(failure);
        await expect(service.hasAnyPermission(query)).rejects.toBe(failure);
        await expect(service.getUserAuthzContext('user-1')).rejects.toBe(failure);
        await expect(service.getCourseAuthzContext('user-1', query.scopeId)).rejects.toBe(failure);
    });
});
