import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { TimeslotsController } from '@/modules/exams/timeslots/timeslots.controller';
import { TimeslotsRepository } from '@/modules/exams/timeslots/timeslots.repository';
import { TimeslotsService } from '@/modules/exams/timeslots/timeslots.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [TimeslotsController],
    providers: [TimeslotsRepository, TimeslotsService],
    exports: [TimeslotsService],
})
export class TimeslotsModule {}
