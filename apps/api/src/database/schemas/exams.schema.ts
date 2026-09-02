import { index, pgTable, smallint, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
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
