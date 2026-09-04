import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

export const QuestionNotFound = (id: string) => new NotFoundException(`Question ${id} not found`);
export const ExamNotFound = (id?: string) => new NotFoundException(id ? `Exam ${id} not found` : 'Exam not found');
export const QuestionCreationFailed = () => new InternalServerErrorException('Failed to create question');
export const QuestionPositionConflict = () => new ConflictException('Question position must be unique within the exam');
export const InvalidQuestionOrder = () =>
    new ConflictException('questionIds must contain every exam question exactly once');
export const QuestionOptionsNotFound = (id: string) =>
    new NotFoundException(`Question options not found for question ${id}`);
