import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { AttemptsController } from '@/modules/exams/attempts/attempts.controller';
import { AttemptsRepository } from '@/modules/exams/attempts/attempts.repository';
import { AttemptsService } from '@/modules/exams/attempts/attempts.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [AttemptsController],
    providers: [AttemptsService, AttemptsRepository],
    exports: [AttemptsService, AttemptsRepository],
})
export class AttemptsModule {}
