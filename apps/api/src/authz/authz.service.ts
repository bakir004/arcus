import { Injectable } from '@nestjs/common';
import { AuthzRepository, type UserAuthzContext } from '@/authz/authz.repository';
import type { PermissionQuery } from '@/authz/authz.types';

@Injectable()
export class AuthzService {
    constructor(private readonly authzRepository: AuthzRepository) {}

    getPermissions(query: PermissionQuery) {
        return this.authzRepository.getPermissions(query);
    }

    async hasAnyPermission(query: PermissionQuery): Promise<boolean> {
        const permissions = await this.getPermissions(query);
        return permissions.length > 0;
    }

    getUserAuthzContext(userId: string): Promise<UserAuthzContext> {
        return this.authzRepository.getUserAuthzContext(userId);
    }
}
