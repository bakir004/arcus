import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

export const CourseNotFound = (id: string) => new NotFoundException(`Course ${id} not found`);
export const CourseCreationFailed = () => new InternalServerErrorException('Failed to create course');
