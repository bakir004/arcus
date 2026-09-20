import { index, numeric, pgTable, timestamp, unique, uuid, text } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { attemptStatusEnum, AttemptStatus } from './enums.schema';
import { examItems, exams } from './exams.schema';

export const examAttempts = pgTable(
    'exam_attempts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        studentId: text('student_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        createdById: text('created_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        status: attemptStatusEnum('status').notNull().default(AttemptStatus.Registered),
        score: numeric('score', { precision: 7, scale: 2 }),
        startedAt: timestamp('started_at'),
        submittedAt: timestamp('submitted_at'),
        gradedAt: timestamp('graded_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [index('exam_attempts_exam_id_idx').on(t.examId), index('exam_attempts_student_id_idx').on(t.studentId)],
);

export const examItemGrades = pgTable(
    'exam_item_grades',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        attemptId: uuid('attempt_id')
            .notNull()
            .references(() => examAttempts.id, { onDelete: 'cascade' }),
        examItemId: uuid('exam_item_id')
            .notNull()
            .references(() => examItems.id, { onDelete: 'cascade' }),
        pointsAwarded: numeric('points_awarded', { precision: 6, scale: 2 }),
        status: text('status').notNull().default('ungraded'),
        feedback: text('feedback'),
        gradedById: text('graded_by_id').references(() => user.id, { onDelete: 'set null' }),
        gradedAt: timestamp('graded_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_item_grades_attempt_id_idx').on(t.attemptId),
        index('exam_item_grades_exam_item_id_idx').on(t.examItemId),
        unique('exam_item_grades_attempt_item_uniq').on(t.attemptId, t.examItemId),
    ],
);
