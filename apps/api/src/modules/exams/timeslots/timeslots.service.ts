import { Injectable } from '@nestjs/common';
import { TimeslotsRepository } from './timeslots.repository';
import type { CreateTimeslotDto, UpdateTimeslotDto } from './timeslot.dto';

@Injectable()
export class TimeslotsService {
    constructor(private readonly repository: TimeslotsRepository) {}
    async list(examId: string, userId?: string) {
        return this.repository.list(await this.repository.resolveExamId(examId), userId);
    }
    async create(examId: string, dto: CreateTimeslotDto) {
        examId = await this.repository.resolveExamId(examId);
        return this.repository.create(examId, { ...dto, startsAt: new Date(dto.startsAt) });
    }
    async update(examId: string, id: string, dto: UpdateTimeslotDto) {
        examId = await this.repository.resolveExamId(examId);
        const { startsAt, ...rest } = dto;
        return this.repository.update(examId, id, { ...rest, ...(startsAt && { startsAt: new Date(startsAt) }) });
    }
    async delete(examId: string, id: string) {
        return this.repository.delete(await this.repository.resolveExamId(examId), id);
    }
    async register(examId: string, id: string, studentId: string) {
        return this.repository.register(await this.repository.resolveExamId(examId), id, studentId);
    }
    async cancel(examId: string, studentId: string) {
        return this.repository.cancel(await this.repository.resolveExamId(examId), studentId);
    }
}
