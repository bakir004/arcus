import {
    check,
    index,
    integer,
    numeric,
    pgTable,
    smallint,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema';
import { courses } from './courses.schema';
import { examTypeEnum, examVisibilityEnum, ExamType } from './enums.schema';

export const exams = pgTable(
    'exams',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        courseId: uuid('course_id')
            .notNull()
            .references(() => courses.id, { onDelete: 'cascade' }),
        createdById: text('created_by_id')
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description'),
        type: examTypeEnum('type').notNull().default(ExamType.Written),
        durationMinutes: smallint('duration_minutes').notNull(),
        maxAttempts: smallint('max_attempts').notNull(),
        visibility: examVisibilityEnum('visibility').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [index('exams_course_id_idx').on(t.courseId), index('exams_created_by_id_idx').on(t.createdById)],
);

/** A gradeable slot. Content and student work are optional. */
export const examItems = pgTable(
    'exam_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        position: integer('position').notNull(),
        label: varchar('label', { length: 64 }),
        maxPoints: numeric('max_points', { precision: 6, scale: 2 }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_items_exam_id_idx').on(t.examId),
        unique('exam_items_exam_position_uniq').on(t.examId, t.position),
        check('exam_items_max_points_positive', sql`${t.maxPoints} >= 0`),
    ],
);
