import type { Database } from '@/database/client';
import type { QuestionType } from '@/database/schema';
import type { AnswerPayload } from '@/modules/exams/answers/answer.entity';

export type DbExecutor = Pick<Database, 'query' | 'select' | 'insert' | 'update' | 'delete'>;

export interface AnswerTypeRepository {
    readonly type: QuestionType;
    readonly answerApiSchema: object;
    validateAnswer(answer: unknown): string | null;
    saveAnswer(db: DbExecutor, answerId: string, answer: AnswerPayload): Promise<void>;
    clearAnswer(db: DbExecutor, answerId: string): Promise<void>;
    loadAnswer(db: DbExecutor, answerId: string): Promise<AnswerPayload>;
    loadAnswersMany(db: DbExecutor, answerIds: string[]): Promise<Map<string, AnswerPayload>>;
}
