import { Module } from '@nestjs/common';
import { AuthzRepository } from '@/authz/authz.repository';
import { AuthzService } from '@/authz/authz.service';
import { PermissionsGuard } from '@/authz/permissions.guard';
import { DatabaseModule } from '@/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [AuthzService, AuthzRepository, PermissionsGuard],
    exports: [AuthzService, PermissionsGuard],
})
export class AuthzModule {}
