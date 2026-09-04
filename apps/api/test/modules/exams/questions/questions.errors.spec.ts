import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
    ExamNotFound,
    InvalidQuestionOrder,
    QuestionCreationFailed,
    QuestionNotFound,
    QuestionOptionsNotFound,
    QuestionPositionConflict,
} from '@/modules/exams/questions/questions.errors';

describe('question errors', () => {
    it('creates errors with stable statuses and messages', () => {
        expect(QuestionNotFound('id')).toEqual(new NotFoundException('Question id not found'));
        expect(ExamNotFound('exam')).toEqual(new NotFoundException('Exam exam not found'));
        expect(ExamNotFound()).toEqual(new NotFoundException('Exam not found'));
        expect(QuestionCreationFailed()).toEqual(new InternalServerErrorException('Failed to create question'));
        expect(QuestionPositionConflict()).toEqual(
            new ConflictException('Question position must be unique within the exam'),
        );
        expect(InvalidQuestionOrder()).toEqual(
            new ConflictException('questionIds must contain every exam question exactly once'),
        );
        expect(QuestionOptionsNotFound('id')).toEqual(
            new NotFoundException('Question options not found for question id'),
        );
    });
});
