import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles, user } from '@/database/schema';

@Injectable()
export class RolesRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async findRoles(courseId: string) {
        const roles = await this.db
            .select({ id: courseRoles.id, name: courseRoles.name })
            .from(courseRoles)
            .where(eq(courseRoles.courseId, courseId))
            .orderBy(asc(courseRoles.name));
        const permissions = await this.db
            .select({ roleId: courseRolePermissions.courseRoleId, permission: courseRolePermissions.permissionKey })
            .from(courseRolePermissions)
            .innerJoin(courseRoles, eq(courseRoles.id, courseRolePermissions.courseRoleId))
            .where(eq(courseRoles.courseId, courseId));
        return roles.map((role) => ({
            ...role,
            permissions: permissions
                .filter((permission) => permission.roleId === role.id)
                .map(({ permission }) => permission),
        }));
    }

    async createRole(courseId: string, createdById: string, name: string, permissions: string[]) {
        return this.db.transaction(async (tx) => {
            const [role] = await tx.insert(courseRoles).values({ courseId, createdById, name }).returning();
            if (!role) throw new NotFoundException('Role could not be created');
            if (permissions.length > 0) {
                await tx
                    .insert(courseRolePermissions)
                    .values(permissions.map((permissionKey) => ({ courseRoleId: role.id, permissionKey })));
            }
            return { ...role, permissions };
        });
    }

    async updatePermissions(courseId: string, roleId: string, permissions: string[]) {
        return this.db.transaction(async (tx) => {
            const [role] = await tx
                .select({ id: courseRoles.id, name: courseRoles.name })
                .from(courseRoles)
                .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
                .limit(1);
            if (!role) throw new NotFoundException('Role not found');

            await tx.delete(courseRolePermissions).where(eq(courseRolePermissions.courseRoleId, roleId));
            if (permissions.length > 0) {
                await tx
                    .insert(courseRolePermissions)
                    .values(permissions.map((permissionKey) => ({ courseRoleId: roleId, permissionKey })));
            }
            return { ...role, permissions };
        });
    }

    async findMembers(courseId: string) {
        const rows = await this.db
            .select({
                id: courseMembers.id,
                userId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                roleId: courseRoles.id,
                roleName: courseRoles.name,
            })
            .from(courseMembers)
            .innerJoin(user, eq(user.id, courseMembers.userId))
            .leftJoin(courseMemberRoles, eq(courseMemberRoles.courseMemberId, courseMembers.id))
            .leftJoin(courseRoles, eq(courseRoles.id, courseMemberRoles.courseRoleId))
            .where(eq(courseMembers.courseId, courseId))
            .orderBy(asc(user.name));

        return rows.reduce<
            Array<{
                id: string;
                userId: string;
                name: string;
                email: string;
                image: string | null;
                roles: Array<{ id: string; name: string }>;
            }>
        >((members, row) => {
            let member = members.find((candidate) => candidate.id === row.id);
            if (!member) {
                member = {
                    id: row.id,
                    userId: row.userId,
                    name: row.name,
                    email: row.email,
                    image: row.image,
                    roles: [],
                };
                members.push(member);
            }
            if (row.roleId && row.roleName) member.roles.push({ id: row.roleId, name: row.roleName });
            return members;
        }, []);
    }

    async assignRole(courseId: string, memberId: string, roleId: string) {
        return this.db.transaction(async (tx) => {
            const [member] = await tx
                .select({ id: courseMembers.id })
                .from(courseMembers)
                .where(and(eq(courseMembers.id, memberId), eq(courseMembers.courseId, courseId)))
                .limit(1);
            if (!member) throw new NotFoundException('Course member not found');

            const [role] = await tx
                .select({ id: courseRoles.id })
                .from(courseRoles)
                .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
                .limit(1);
            if (!role) throw new NotFoundException('Role not found');

            await tx.delete(courseMemberRoles).where(eq(courseMemberRoles.courseMemberId, memberId));
            await tx.insert(courseMemberRoles).values({ courseMemberId: memberId, courseRoleId: roleId });
        });
    }
}
