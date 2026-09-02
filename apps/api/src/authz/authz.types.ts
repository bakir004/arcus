import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import type { auth } from '@/auth';
import type { Permission } from '@/authz/permissions';

export type PermissionScope = 'course' | 'faculty';

export interface PermissionRequirement {
    scope: PermissionScope;
    routeParam: string;
    permissions: Permission[];
}

export interface PermissionQuery {
    userId: string;
    scope: PermissionScope;
    scopeId: string;
    permissions: Permission[];
}

export interface AuthzContext {
    scope: PermissionScope;
    scopeId: string;
    permissions: Permission[];
}

export type AuthenticatedRequest = Request & {
    session?: UserSession<typeof auth> | null;
    user?: UserSession<typeof auth>['user'] | null;
    authz?: AuthzContext;
};
