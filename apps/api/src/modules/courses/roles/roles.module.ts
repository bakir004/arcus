import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [RolesController],
    providers: [RolesService, RolesRepository],
})
export class RolesModule {}
