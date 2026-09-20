import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { examItems } from './exams.schema';
import { examAttempts } from './attempts.schema';

export type CodingExecutionTestResult = {
    id?: string;
    name?: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    passed: boolean;
    error?: string;
    expectedOutput?: string;
    assembledCode?: string;
};

export type CodingExecutionResult = {
    mode: string;
    passed: boolean;
    compile: CodingExecutionTestResult;
    tests: CodingExecutionTestResult[];
};

export const examCodingExecutions = pgTable(
    'exam_coding_executions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        attemptId: uuid('attempt_id')
            .notNull()
            .references(() => examAttempts.id, { onDelete: 'cascade' }),
        examItemId: uuid('exam_item_id')
            .notNull()
            .references(() => examItems.id, { onDelete: 'cascade' }),
        jobId: varchar('job_id', { length: 255 }).notNull(),
        studentCode: text('student_code').notNull(),
        result: jsonb('result').$type<CodingExecutionResult>().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [index('exam_coding_executions_attempt_item_created_idx').on(t.attemptId, t.examItemId, t.createdAt)],
);
