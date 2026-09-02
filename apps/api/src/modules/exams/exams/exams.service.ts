import { Injectable } from '@nestjs/common';
import { CreateExamDto, UpdateExamDto } from '@/modules/exams/exams/exams.dto';
import { createExamSchema, updateExamSchema } from '@/modules/exams/exams/exams.entity';
import { ExamsRepository } from '@/modules/exams/exams/exams.repository';

@Injectable()
export class ExamsService {
    constructor(private readonly examsRepository: ExamsRepository) {}

    create(courseId: string, createdById: string, dto: CreateExamDto) {
        const data = createExamSchema.parse(dto);
        return this.examsRepository.create(courseId, createdById, data);
    }

    findAll(courseId: string) {
        return this.examsRepository.findAll(courseId);
    }

    findById(courseId: string, id: string) {
        return this.examsRepository.findById(courseId, id);
    }

    update(courseId: string, id: string, dto: UpdateExamDto) {
        const data = updateExamSchema.parse(dto);
        return this.examsRepository.update(courseId, id, data);
    }

    delete(courseId: string, id: string) {
        return this.examsRepository.delete(courseId, id);
    }
}
