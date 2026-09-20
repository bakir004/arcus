import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { exams } from './exams.schema';

export const examAnnouncements = pgTable(
    'exam_announcements',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 255 }),
        message: text('message').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [index('exam_announcements_exam_id_created_at_idx').on(t.examId, t.createdAt)],
);
