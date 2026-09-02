import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { ExamsController } from '@/modules/exams/exams/exams.controller';
import { ExamsRepository } from '@/modules/exams/exams/exams.repository';
import { ExamsService } from '@/modules/exams/exams/exams.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [ExamsController],
    providers: [ExamsService, ExamsRepository],
    exports: [ExamsService],
})
export class ExamsModule {}
