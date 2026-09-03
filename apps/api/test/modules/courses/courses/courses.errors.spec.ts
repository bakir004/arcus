import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CourseCreationFailed, CourseNotFound } from '@/modules/courses/courses/courses.errors';

describe('course errors', () => {
    it('creates a not-found error with the course identifier', () => {
        const error = CourseNotFound('course-1');
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toBe(404);
        expect(error.message).toBe('Course course-1 not found');
    });

    it('creates an internal error for failed creation', () => {
        const error = CourseCreationFailed();
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getStatus()).toBe(500);
        expect(error.message).toBe('Failed to create course');
    });
});
