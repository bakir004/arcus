import { Injectable } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { auth } from '@/auth';
import { Permissions } from '@/authz/permissions';
import { CreateCourseRoleDto, UpdateCourseRoleDto } from './roles.dto';
import { RolesRepository } from './roles.repository';

export const COURSE_PERMISSIONS = Object.values(Permissions);

@Injectable()
export class RolesService {
    constructor(private readonly rolesRepository: RolesRepository) {}

    findRoles(courseId: string) {
        return this.rolesRepository.findRoles(courseId);
    }

    findMembers(courseId: string) {
        return this.rolesRepository.findMembers(courseId);
    }

    createRole(courseId: string, session: UserSession<typeof auth>, dto: CreateCourseRoleDto) {
        return this.rolesRepository.createRole(
            courseId,
            session.user.id,
            dto.name.trim(),
            this.normalizePermissions(dto.permissions),
        );
    }

    updateRole(courseId: string, roleId: string, dto: UpdateCourseRoleDto) {
        return this.rolesRepository.updateRole(
            courseId,
            roleId,
            dto.name?.trim(),
            dto.permissions === undefined ? undefined : this.normalizePermissions(dto.permissions),
        );
    }

    deleteRole(courseId: string, roleId: string) {
        return this.rolesRepository.deleteRole(courseId, roleId);
    }

    assignRole(courseId: string, memberId: string, roleId: string) {
        return this.rolesRepository.assignRole(courseId, memberId, roleId);
    }

    private normalizePermissions(permissions: string[]) {
        return [...new Set(permissions)].filter((permission) => COURSE_PERMISSIONS.includes(permission as never));
    }
}
