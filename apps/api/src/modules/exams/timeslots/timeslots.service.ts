import { Injectable } from '@nestjs/common';
import { TimeslotsRepository } from './timeslots.repository';
import type { CreateTimeslotDto, UpdateTimeslotDto } from './timeslot.dto';

@Injectable()
export class TimeslotsService {
    constructor(private readonly repository: TimeslotsRepository) {}
    list(examId: string, userId?: string) {
        return this.repository.list(examId, userId);
    }
    async create(examId: string, dto: CreateTimeslotDto) {
        await this.repository.ensureExam(examId);
        return this.repository.create(examId, { ...dto, startsAt: new Date(dto.startsAt) });
    }
    update(examId: string, id: string, dto: UpdateTimeslotDto) {
        const { startsAt, ...rest } = dto;
        return this.repository.update(examId, id, { ...rest, ...(startsAt && { startsAt: new Date(startsAt) }) });
    }
    delete(examId: string, id: string) {
        return this.repository.delete(examId, id);
    }
    register(examId: string, id: string, studentId: string) {
        return this.repository.register(examId, id, studentId);
    }
    cancel(examId: string, studentId: string) {
        return this.repository.cancel(examId, studentId);
    }
}
