import type { QuestionType } from '@/database/schema';
import type { QuestionOptions } from '@/modules/exams/questions/questions.entity';

import type { Database } from '@/database/client';

export type DbExecutor = Database;

export interface QuestionTypeRepository {
    readonly type: QuestionType;
    readonly optionsApiSchema: object;
    validateOptions(options: unknown): string | null;
    saveOptions(db: DbExecutor, questionId: string, options: QuestionOptions): Promise<void>;
    clearOptions(db: DbExecutor, questionId: string): Promise<void>;
    loadOptions(db: DbExecutor, questionId: string): Promise<QuestionOptions>;
    loadOptionsMany(db: DbExecutor, questionIds: string[]): Promise<Map<string, QuestionOptions>>;
}
