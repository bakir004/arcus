import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles, user } from '@/database/schema';
import {
    CourseMemberNotFound,
    CourseRoleCreationFailed,
    CourseRoleHasAssignedUsers,
    CourseRoleNameConflict,
    CourseRoleNotFound,
} from './roles.errors';

function throwRoleNameConflict(error: unknown): void {
    if (isUniqueViolation(error)) {
        throw CourseRoleNameConflict();
    }
}

function isUniqueViolation(error: unknown, seen = new Set<object>()): boolean {
    if (!error || typeof error !== 'object' || seen.has(error)) return false;
    seen.add(error);

    const candidate = error as { code?: unknown; cause?: unknown; originalError?: unknown };
    return (
        candidate.code === '23505' ||
        isUniqueViolation(candidate.cause, seen) ||
        isUniqueViolation(candidate.originalError, seen)
    );
}

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
        try {
            return await this.db.transaction(async (tx) => {
                const [role] = await tx.insert(courseRoles).values({ courseId, createdById, name }).returning();
                if (!role) throw CourseRoleCreationFailed();
                if (permissions.length > 0) {
                    await tx
                        .insert(courseRolePermissions)
                        .values(permissions.map((permissionKey) => ({ courseRoleId: role.id, permissionKey })));
                }
                return { ...role, permissions };
            });
        } catch (error) {
            throwRoleNameConflict(error);
            throw error;
        }
    }

    async updateRole(courseId: string, roleId: string, name?: string, permissions?: string[]) {
        try {
            return await this.db.transaction(async (tx) => {
                const [role] = await tx
                    .select({ id: courseRoles.id, name: courseRoles.name })
                    .from(courseRoles)
                    .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
                    .limit(1);
                if (!role) throw CourseRoleNotFound();

                const [updatedRole] = name
                    ? await tx
                          .update(courseRoles)
                          .set({ name, updatedAt: new Date() })
                          .where(eq(courseRoles.id, roleId))
                          .returning({ id: courseRoles.id, name: courseRoles.name })
                    : [role];

                if (permissions !== undefined) {
                    await tx.delete(courseRolePermissions).where(eq(courseRolePermissions.courseRoleId, roleId));
                    if (permissions.length > 0) {
                        await tx
                            .insert(courseRolePermissions)
                            .values(permissions.map((permissionKey) => ({ courseRoleId: roleId, permissionKey })));
                    }
                }

                const currentPermissions = await tx
                    .select({ permission: courseRolePermissions.permissionKey })
                    .from(courseRolePermissions)
                    .where(eq(courseRolePermissions.courseRoleId, roleId));
                return {
                    ...updatedRole,
                    permissions: currentPermissions.map(({ permission }) => permission),
                };
            });
        } catch (error) {
            throwRoleNameConflict(error);
            throw error;
        }
    }

    async deleteRole(courseId: string, roleId: string) {
        const assigned = await this.db
            .select({ memberId: courseMemberRoles.courseMemberId })
            .from(courseMemberRoles)
            .innerJoin(courseRoles, eq(courseRoles.id, courseMemberRoles.courseRoleId))
            .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
            .limit(1);
        if (assigned.length > 0) throw CourseRoleHasAssignedUsers();

        const deleted = await this.db
            .delete(courseRoles)
            .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
            .returning({ id: courseRoles.id });
        if (deleted.length === 0) throw CourseRoleNotFound();
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
            if (!member) throw CourseMemberNotFound();

            const [role] = await tx
                .select({ id: courseRoles.id })
                .from(courseRoles)
                .where(and(eq(courseRoles.id, roleId), eq(courseRoles.courseId, courseId)))
                .limit(1);
            if (!role) throw CourseRoleNotFound();

            await tx.delete(courseMemberRoles).where(eq(courseMemberRoles.courseMemberId, memberId));
            await tx.insert(courseMemberRoles).values({ courseMemberId: memberId, courseRoleId: roleId });
        });
    }
}
