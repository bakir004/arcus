import { Module } from '@nestjs/common';
import { AuthzModule } from '@/authz/authz.module';
import { DatabaseModule } from '@/database/database.module';
import { AnnouncementsController } from '@/modules/exams/announcements/announcements.controller';
import { AnnouncementsRepository } from '@/modules/exams/announcements/announcements.repository';
import { AnnouncementsService } from '@/modules/exams/announcements/announcements.service';

@Module({
    imports: [DatabaseModule, AuthzModule],
    controllers: [AnnouncementsController],
    providers: [AnnouncementsService, AnnouncementsRepository],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
