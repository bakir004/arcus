import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

export const ExamNotFound = (id: string) => new NotFoundException(`Exam ${id} not found`);
export const ExamCreationFailed = () => new InternalServerErrorException('Failed to create exam');
