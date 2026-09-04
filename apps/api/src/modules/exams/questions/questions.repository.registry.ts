import { QuestionType } from '@/database/schema';
import { codingRepository } from '@/modules/exams/questions/coding/coding.repository';
import { essayRepository } from '@/modules/exams/questions/essay/essay.repository';
import { multipleChoiceRepository } from '@/modules/exams/questions/mcq/mcq.repository';
import type { QuestionTypeRepository } from '@/modules/exams/questions/questions.repository.interface';

const questionRepositories = new Map<QuestionType, QuestionTypeRepository>([
    [QuestionType.MultipleChoice, multipleChoiceRepository],
    [QuestionType.Coding, codingRepository],
    [QuestionType.Essay, essayRepository],
]);

export function getQuestionRepository(type: QuestionType): QuestionTypeRepository {
    const repository = questionRepositories.get(type);
    if (!repository) throw new Error(`No repository registered for question type: "${type}"`);
    return repository;
}

export function getAllQuestionRepositories(): QuestionTypeRepository[] {
    return [...questionRepositories.values()];
}
