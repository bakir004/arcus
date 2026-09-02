import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { AuthzService } from '@/authz/authz.service';
import type { AuthenticatedRequest } from '@/authz/authz.types';
import { RequirePermission } from '@/authz/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
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
        if (!session) throw new UnauthorizedException();

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

        if (permissions.length === 0) throw new ForbiddenException();

        request.authz = {
            scope: requirement.scope,
            scopeId,
            permissions,
        };

        return true;
    }
}
