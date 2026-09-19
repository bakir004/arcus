jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));

import { RolesController } from '@/modules/courses/roles/roles.controller';
import { COURSE_PERMISSIONS, RolesService } from '@/modules/courses/roles/roles.service';

const courseId = '11111111-1111-4111-8111-111111111111';
const roleId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';

function setup() {
    const repository = {
        findRoles: jest.fn().mockResolvedValue([{ id: roleId, name: 'Teacher', permissions: [] }]),
        findMembers: jest.fn().mockResolvedValue([]),
        createRole: jest.fn().mockResolvedValue({ id: roleId }),
        updateRole: jest.fn().mockResolvedValue({ id: roleId }),
        deleteRole: jest.fn().mockResolvedValue(undefined),
        assignRole: jest.fn().mockResolvedValue(undefined),
    };
    const service = new RolesService(repository as never);
    return { repository, service, controller: new RolesController(service) };
}

describe('RolesService and RolesController', () => {
    it('delegates reads and exposes permissions', async () => {
        const { repository, service, controller } = setup();
        await expect(controller.findRoles(courseId)).resolves.toEqual([{ id: roleId, name: 'Teacher', permissions: [] }]);
        await expect(controller.findMembers(courseId)).resolves.toEqual([]);
        expect(controller.findPermissions()).toEqual(COURSE_PERMISSIONS);
        expect(repository.findRoles).toHaveBeenCalledWith(courseId);
        expect(repository.findMembers).toHaveBeenCalledWith(courseId);
        await expect(service.findRoles(courseId)).resolves.toEqual([{ id: roleId, name: 'Teacher', permissions: [] }]);
        await expect(service.findMembers(courseId)).resolves.toEqual([]);
    });

    it('normalizes permissions and delegates role mutations', async () => {
        const { repository, service, controller } = setup();
        const session = { user: { id: 'user-1' } } as never;
        const permission = COURSE_PERMISSIONS[0];
        await expect(controller.createRole(courseId, session, { name: '  Teacher  ', permissions: [permission, permission, 'invalid'] })).resolves.toEqual({ id: roleId });
        expect(repository.createRole).toHaveBeenCalledWith(courseId, 'user-1', 'Teacher', [permission]);
        await expect(controller.updateRole(courseId, roleId, { name: '  Updated  ', permissions: [permission, 'invalid'] })).resolves.toEqual({ id: roleId });
        expect(repository.updateRole).toHaveBeenCalledWith(courseId, roleId, 'Updated', [permission]);
        await expect(service.updateRole(courseId, roleId, {})).resolves.toEqual({ id: roleId });
        expect(repository.updateRole).toHaveBeenLastCalledWith(courseId, roleId, undefined, undefined);
        await expect(controller.deleteRole(courseId, roleId)).resolves.toEqual({ success: true });
        await expect(controller.assignRole(courseId, memberId, { roleId })).resolves.toEqual({ success: true });
        expect(repository.deleteRole).toHaveBeenCalledWith(courseId, roleId);
        expect(repository.assignRole).toHaveBeenCalledWith(courseId, memberId, roleId);
        await expect(service.deleteRole(courseId, roleId)).resolves.toBeUndefined();
        await expect(service.assignRole(courseId, memberId, roleId)).resolves.toBeUndefined();
    });
});
