import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { AuthzService } from '@/authz/authz.service';
import type { AuthenticatedRequest } from '@/authz/authz.types';
import { RequirePermission } from '@/authz/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly authzService: AuthzService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirement = this.reflector.getAllAndOverride(RequirePermission, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requirement) return true;

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const session = request.session;
        this.logger.log(
            JSON.stringify({
                method: request.method,
                path: request.originalUrl ?? request.url,
                hasSession: Boolean(session),
                userId: session?.user.id ?? null,
                userEmail: session?.user.email ?? null,
                requirement,
            }),
        );
        if (!session) {
            this.logger.warn(
                JSON.stringify({
                    message: 'No session found',
                    userId: null,
                    userEmail: null,
                    path: request.originalUrl ?? request.url,
                    method: request.method,
                    requirement,
                })
            )
            throw new UnauthorizedException();
        }

        const scopeId = request.params[requirement.routeParam];
        if (typeof scopeId !== 'string' || !isUUID(scopeId)) {
            throw new BadRequestException(`Invalid ${requirement.routeParam} UUID`);
        }

        const permissions = await this.authzService.getPermissions({
            userId: session.user.id,
            scope: requirement.scope,
            scopeId,
            permissions: requirement.permissions,
        });

        this.logger.log(
            JSON.stringify({
                userId: session.user.id,
                scope: requirement.scope,
                scopeId,
                requestedPermissions: requirement.permissions,
                grantedPermissions: permissions,
                allowed: permissions.length > 0,
            }),
        );

        if (permissions.length === 0) throw new ForbiddenException();

        request.authz = {
            scope: requirement.scope,
            scopeId,
            permissions,
        };

        return true;
    }
}
