import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { PermissionQuery } from '@/authz/authz.types';
import type { Permission } from '@/authz/permissions';
import type { Database } from '@/database/client';
import { DATABASE } from '@/database/database.module';
import { courseMemberRoles, courseMembers, courseRolePermissions, courseRoles } from '@/database/schema';

export interface UserAuthzContext {
    roles: string[];
    permissions: string[];
}

@Injectable()
export class AuthzRepository {
    constructor(@Inject(DATABASE) private readonly db: Database) {}

    async getPermissions(query: PermissionQuery): Promise<Permission[]> {
        switch (query.scope) {
            case 'course':
                return this.getCoursePermissions(query);
            case 'faculty':
                return [];
        }
    }

    async getUserAuthzContext(userId: string): Promise<UserAuthzContext> {
        const rows = await this.db
            .select({
                role: courseRoles.name,
                permission: courseRolePermissions.permissionKey,
            })
            .from(courseMembers)
            .innerJoin(courseMemberRoles, eq(courseMemberRoles.courseMemberId, courseMembers.id))
            .innerJoin(courseRoles, eq(courseRoles.id, courseMemberRoles.courseRoleId))
            .innerJoin(courseRolePermissions, eq(courseRolePermissions.courseRoleId, courseRoles.id))
            .where(eq(courseMembers.userId, userId));

        return this.toAuthzContext(rows);
    }

    async getCourseAuthzContext(userId: string, courseId: string): Promise<UserAuthzContext> {
        const rows = await this.db
            .select({
                role: courseRoles.name,
                permission: courseRolePermissions.permissionKey,
            })
            .from(courseMembers)
            .innerJoin(courseMemberRoles, eq(courseMemberRoles.courseMemberId, courseMembers.id))
            .innerJoin(courseRoles, eq(courseRoles.id, courseMemberRoles.courseRoleId))
            .innerJoin(courseRolePermissions, eq(courseRolePermissions.courseRoleId, courseRoles.id))
            .where(
                and(
                    eq(courseMembers.userId, userId),
                    eq(courseMembers.courseId, courseId),
                    eq(courseRoles.courseId, courseId),
                ),
            );

        return this.toAuthzContext(rows);
    }

    private toAuthzContext(rows: { role: string; permission: string }[]): UserAuthzContext {
        return {
            roles: [...new Set(rows.map((row) => row.role))].sort(),
            permissions: [...new Set(rows.map((row) => row.permission))].sort(),
        };
    }

    private async getCoursePermissions(query: PermissionQuery): Promise<Permission[]> {
        if (query.permissions.length === 0) return [];

        const rows = await this.db
            .select({ permission: courseRolePermissions.permissionKey })
            .from(courseMembers)
            .innerJoin(courseMemberRoles, eq(courseMemberRoles.courseMemberId, courseMembers.id))
            .innerJoin(courseRoles, eq(courseRoles.id, courseMemberRoles.courseRoleId))
            .innerJoin(courseRolePermissions, eq(courseRolePermissions.courseRoleId, courseRoles.id))
            .where(
                and(
                    eq(courseMembers.userId, query.userId),
                    eq(courseMembers.courseId, query.scopeId),
                    eq(courseRoles.courseId, query.scopeId),
                    inArray(courseRolePermissions.permissionKey, query.permissions),
                ),
            );

        return [...new Set(rows.map((row) => row.permission as Permission))];
    }
}
