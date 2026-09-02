import { Injectable } from '@nestjs/common';
import { CreateCourseDto, UpdateCourseDto } from '@/modules/courses/courses/courses.dto';
import { createCourseSchema, updateCourseSchema } from '@/modules/courses/courses/courses.entity';
import { CoursesRepository } from '@/modules/courses/courses/courses.repository';

@Injectable()
export class CoursesService {
    constructor(private readonly coursesRepository: CoursesRepository) {}

    create(createdById: string, dto: CreateCourseDto) {
        const data = createCourseSchema.parse(dto);
        return this.coursesRepository.create(createdById, data);
    }

    findAll() {
        return this.coursesRepository.findAll();
    }

    findById(id: string) {
        return this.coursesRepository.findById(id);
    }

    findByCode(code: string) {
        return this.coursesRepository.findByCode(code);
    }

    update(id: string, dto: UpdateCourseDto) {
        const data = updateCourseSchema.parse(dto);
        return this.coursesRepository.update(id, data);
    }

    delete(id: string) {
        return this.coursesRepository.delete(id);
    }
}
