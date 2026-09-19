import { NotFoundException } from '@nestjs/common';
import { RolesRepository } from '@/modules/courses/roles/roles.repository';

const courseId = '11111111-1111-4111-8111-111111111111';
const roleId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';

function database(results: unknown[]) {
    const queue = [...results];
    const chain: any = {};
    for (const method of ['from', 'innerJoin', 'leftJoin', 'where', 'orderBy', 'limit', 'values', 'set', 'returning']) {
        chain[method] = jest.fn(() => chain);
    }
    chain.then = (resolve: (value: unknown) => unknown) => resolve(queue.shift());
    const db: any = {
        select: jest.fn(() => chain),
        insert: jest.fn(() => chain),
        update: jest.fn(() => chain),
        delete: jest.fn(() => chain),
        transaction: jest.fn((callback: (tx: any) => unknown) => callback(db)),
    };
    return { db, chain };
}

describe('RolesRepository', () => {
    it('reads roles and groups member rows', async () => {
        const { db } = database([
            [{ id: roleId, name: 'Teacher' }],
            [{ roleId, permission: 'course:read' }],
        ]);
        const repository = new RolesRepository(db);
        await expect(repository.findRoles(courseId)).resolves.toEqual([
            { id: roleId, name: 'Teacher', permissions: ['course:read'] },
        ]);

        const membersDb = database([
            [
                { id: memberId, userId: 'user-1', name: 'A', email: 'a@test', image: null, roleId, roleName: 'Teacher' },
                { id: memberId, userId: 'user-1', name: 'A', email: 'a@test', image: null, roleId: null, roleName: null },
                { id: 'other', userId: 'user-2', name: 'B', email: 'b@test', image: 'x', roleId: null, roleName: null },
            ],
        ]);
        await expect(new RolesRepository(membersDb.db).findMembers(courseId)).resolves.toEqual([
            { id: memberId, userId: 'user-1', name: 'A', email: 'a@test', image: null, roles: [{ id: roleId, name: 'Teacher' }] },
            { id: 'other', userId: 'user-2', name: 'B', email: 'b@test', image: 'x', roles: [] },
        ]);
    });

    it('creates and updates roles with and without permissions', async () => {
        const role = { id: roleId, courseId, name: 'Teacher' };
        const created = database([[role]]);
        await expect(new RolesRepository(created.db).createRole(courseId, 'user-1', 'Teacher', [])).resolves.toEqual({ ...role, permissions: [] });
        const createdWithPermissions = database([[role], []]);
        await expect(new RolesRepository(createdWithPermissions.db).createRole(courseId, 'user-1', 'Teacher', ['course:read'])).resolves.toEqual({ ...role, permissions: ['course:read'] });
        const updated = database([[{ id: roleId, name: 'Old' }], [{ id: roleId, name: 'New' }], [], [], [{ permission: 'course:read' }]]);
        await expect(new RolesRepository(updated.db).updateRole(courseId, roleId, 'New', ['course:read'])).resolves.toEqual({ id: roleId, name: 'New', permissions: ['course:read'] });
        const unchanged = database([[{ id: roleId, name: 'New' }], [{ permission: 'course:read' }]]);
        await expect(new RolesRepository(unchanged.db).updateRole(courseId, roleId)).resolves.toEqual({ id: roleId, name: 'New', permissions: ['course:read'] });
        const missing = database([[]]);
        await expect(new RolesRepository(missing.db).updateRole(courseId, roleId)).rejects.toBeInstanceOf(NotFoundException);
        const failed = database([[]]);
        await expect(new RolesRepository(failed.db).createRole(courseId, 'user-1', 'x', [])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes and assigns roles, rejecting invalid relationships', async () => {
        const deleted = database([[], [{ id: roleId }]]);
        await expect(new RolesRepository(deleted.db).deleteRole(courseId, roleId)).resolves.toBeUndefined();

        const assigned = database([[{ id: memberId }], [{ id: roleId }]]);
        await expect(new RolesRepository(assigned.db).assignRole(courseId, memberId, roleId)).resolves.toBeUndefined();
    });
});
