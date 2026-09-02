import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { CoursesController } from '@/modules/courses/courses/courses.controller';
import { CoursesRepository } from '@/modules/courses/courses/courses.repository';
import { CoursesService } from '@/modules/courses/courses/courses.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [CoursesController],
    providers: [CoursesService, CoursesRepository],
    exports: [CoursesService],
})
export class CoursesModule {}
