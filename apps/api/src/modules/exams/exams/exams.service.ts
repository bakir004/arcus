import { Injectable } from '@nestjs/common';
import { mapZodErrorToBadRequest } from '@/common/zod-parse';
import { CreateExamDto, UpdateExamDto } from '@/modules/exams/exams/exams.dto';
import { createExamSchema, updateExamSchema } from '@/modules/exams/exams/exams.entity';
import { ExamsRepository } from '@/modules/exams/exams/exams.repository';

@Injectable()
export class ExamsService {
    constructor(private readonly examsRepository: ExamsRepository) {}

    create(courseId: string, createdById: string, dto: CreateExamDto) {
        const result = createExamSchema.safeParse(dto);
        if (!result.success) throw mapZodErrorToBadRequest(result.error);
        const data = result.data;
        return this.examsRepository.create(courseId, createdById, data);
    }

    findAll(courseId: string) {
        return this.examsRepository.findAll(courseId);
    }

    findById(courseId: string, id: string) {
        return this.examsRepository.findById(courseId, id);
    }

    update(courseId: string, id: string, dto: UpdateExamDto) {
        const result = updateExamSchema.safeParse(dto);
        if (!result.success) throw mapZodErrorToBadRequest(result.error);
        const data = result.data;
        return this.examsRepository.update(courseId, id, data);
    }

    delete(courseId: string, id: string) {
        return this.examsRepository.delete(courseId, id);
    }
}
