import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { AuthzModule } from '@/authz/authz.module';
import { StorageModule } from '@/storage/storage.module';
import { MaterialsController } from './materials.controller';
import { MaterialsRepository } from './materials.repository';
import { MaterialsService } from './materials.service';
import { CourseGroupsRepository } from './groups.repository';

@Module({
    imports: [DatabaseModule, StorageModule, AuthzModule],
    controllers: [MaterialsController],
    providers: [MaterialsService, MaterialsRepository, CourseGroupsRepository],
})
export class MaterialsModule {}
