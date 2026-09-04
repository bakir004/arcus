import { QuestionType } from '@/database/schema';
import {
    getAllQuestionRepositories,
    getQuestionRepository,
} from '@/modules/exams/questions/questions.repository.registry';

describe('question repository registry', () => {
    it('returns all registered types and resolves each one', () => {
        const repositories = getAllQuestionRepositories();
        expect(repositories.map((repository) => repository.type)).toEqual([
            QuestionType.MultipleChoice,
            QuestionType.Coding,
            QuestionType.Essay,
        ]);
        for (const repository of repositories) expect(getQuestionRepository(repository.type)).toBe(repository);
    });

    it('rejects unknown question types', () => {
        expect(() => getQuestionRepository('unknown' as QuestionType)).toThrow('No repository registered');
    });
});
