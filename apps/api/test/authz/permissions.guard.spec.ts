import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthzService } from '@/authz/authz.service';
import { Permissions } from '@/authz/permissions';
import { PermissionsGuard } from '@/authz/permissions.guard';
import type { PermissionRequirement } from '@/authz/authz.types';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const requirement: PermissionRequirement = {
    scope: 'course',
    routeParam: 'courseId',
    permissions: [Permissions.ExamRead, Permissions.ExamUpdate],
};

function contextFor(request: Record<string, unknown>): ExecutionContext {
    return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
}

function createGuard(metadata: PermissionRequirement | undefined, permissions: string[] = [Permissions.ExamRead]) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(metadata) };
    const authzService = { getPermissions: jest.fn().mockResolvedValue(permissions) };
    const guard = new PermissionsGuard(reflector as unknown as Reflector, authzService as unknown as AuthzService);
    return { guard, reflector, authzService };
}

describe('PermissionsGuard', () => {
    it('allows routes without permission metadata', async () => {
        const { guard, authzService } = createGuard(undefined);
        const context = contextFor({});

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(authzService.getPermissions).not.toHaveBeenCalled();
    });

    it.each([undefined, null])('rejects a missing session with 401 (%s)', async (session) => {
        const { guard } = createGuard(requirement);
        const context = contextFor({ method: 'GET', url: '/courses', params: {}, session });

        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it.each([undefined, null, 'not-a-uuid'])('rejects a missing or invalid scope id (%s)', async (scopeId) => {
        const { guard, authzService } = createGuard(requirement);
        const request = { method: 'GET', url: '/courses', params: { courseId: scopeId }, session: { user: { id: 'user-1' } } };

        await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(BadRequestException);
        expect(authzService.getPermissions).not.toHaveBeenCalled();
    });

    it('rejects when no requested permission is granted', async () => {
        const { guard, authzService } = createGuard(requirement, []);
        const request = { method: 'GET', url: '/courses', params: { courseId: COURSE_ID }, session: { user: { id: 'user-1', email: 'u@example.com' } } };

        await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
        expect(authzService.getPermissions).toHaveBeenCalledWith({
            userId: 'user-1',
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: requirement.permissions,
        });
        expect(request).not.toHaveProperty('authz');
    });

    it('allows a course request and attaches authorization context', async () => {
        const { guard, authzService } = createGuard(requirement, [Permissions.ExamUpdate]);
        const request: Record<string, unknown> & { authz?: unknown } = {
            method: 'PATCH',
            originalUrl: `/courses/${COURSE_ID}`,
            params: { courseId: COURSE_ID },
            session: { user: { id: 'user-1' } },
        };

        await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
        expect(authzService.getPermissions).toHaveBeenCalledWith({
            userId: 'user-1',
            scope: 'course',
            scopeId: COURSE_ID,
            permissions: requirement.permissions,
        });
        expect(request.authz).toEqual({ scope: 'course', scopeId: COURSE_ID, permissions: [Permissions.ExamUpdate] });
    });

    it('supports faculty metadata and uses the configured route parameter', async () => {
        const facultyRequirement: PermissionRequirement = {
            scope: 'faculty',
            routeParam: 'facultyId',
            permissions: [Permissions.CourseRead],
        };
        const { guard, authzService } = createGuard(facultyRequirement, [Permissions.CourseRead]);
        const request: Record<string, unknown> & { authz?: unknown } = {
            method: 'GET',
            url: '/faculties',
            params: { facultyId: COURSE_ID },
            session: { user: { id: 'user-2' } },
        };

        await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
        expect(authzService.getPermissions).toHaveBeenCalledWith({
            userId: 'user-2',
            scope: 'faculty',
            scopeId: COURSE_ID,
            permissions: [Permissions.CourseRead],
        });
        expect(request.authz).toEqual({ scope: 'faculty', scopeId: COURSE_ID, permissions: [Permissions.CourseRead] });
    });

    it('propagates authorization repository failures', async () => {
        const { guard, authzService } = createGuard(requirement);
        const failure = new Error('authorization database unavailable');
        authzService.getPermissions.mockRejectedValue(failure);
        const request = { method: 'GET', url: '/courses', params: { courseId: COURSE_ID }, session: { user: { id: 'user-1' } } };

        await expect(guard.canActivate(contextFor(request))).rejects.toBe(failure);
    });
});
