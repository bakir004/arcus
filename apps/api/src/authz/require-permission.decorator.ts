import { Reflector } from '@nestjs/core';
import type { PermissionRequirement } from '@/authz/authz.types';

export const RequirePermission = Reflector.createDecorator<PermissionRequirement>();
