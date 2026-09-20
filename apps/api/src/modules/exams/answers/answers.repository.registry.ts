import { QuestionType } from '@/database/schema';
import type { AnswerTypeRepository } from '@/modules/exams/answers/answers.repository.interface';
import { codingAnswerRepository } from '@/modules/exams/answers/coding/coding.repository';
import { essayAnswerRepository } from '@/modules/exams/answers/essay/essay.repository';
import { mcqAnswerRepository } from '@/modules/exams/answers/mcq/mcq.repository';

const answerRepositories = new Map<QuestionType, AnswerTypeRepository>([
    [QuestionType.MultipleChoice, mcqAnswerRepository],
    [QuestionType.Coding, codingAnswerRepository],
    [QuestionType.Essay, essayAnswerRepository],
]);

export function getAnswerRepository(type: QuestionType): AnswerTypeRepository {
    const repository = answerRepositories.get(type);
    if (!repository) throw new Error(`No answer repository registered for question type: "${type}"`);
    return repository;
}

export function getAllAnswerRepositories(): AnswerTypeRepository[] {
    return [...answerRepositories.values()];
}
