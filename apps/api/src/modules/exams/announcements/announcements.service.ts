import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '@/modules/exams/announcements/announcement.dto';
import { createAnnouncementSchema, updateAnnouncementSchema } from '@/modules/exams/announcements/announcement.entity';
import { AnnouncementsRepository } from '@/modules/exams/announcements/announcements.repository';

@Injectable()
export class AnnouncementsService {
    constructor(private readonly announcementsRepository: AnnouncementsRepository) {}

    create(examId: string, dto: CreateAnnouncementDto) {
        const result = createAnnouncementSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);
        return this.announcementsRepository.create(examId, result.data);
    }

    findAll(examId: string) {
        return this.announcementsRepository.findAllByExam(examId);
    }

    findById(examId: string, id: string) {
        return this.announcementsRepository.findById(examId, id);
    }

    update(examId: string, id: string, dto: UpdateAnnouncementDto) {
        const result = updateAnnouncementSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);
        return this.announcementsRepository.update(examId, id, result.data);
    }

    delete(examId: string, id: string) {
        return this.announcementsRepository.delete(examId, id);
    }
}
