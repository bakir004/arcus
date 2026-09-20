import { check, index, integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema';
import { exams } from './exams.schema';

export const EXAM_LOCATIONS = ['A-101', 'A-102', 'B-201', 'C-301', 'Main hall'] as const;
export type ExamLocation = (typeof EXAM_LOCATIONS)[number];

export const examTimeslots = pgTable(
    'exam_timeslots',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        location: varchar('location', { length: 255 }).notNull(),
        startsAt: timestamp('starts_at').notNull(),
        capacity: integer('capacity').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_timeslots_exam_id_idx').on(t.examId),
        check('exam_timeslots_capacity_positive', sql`${t.capacity} > 0`),
    ],
);

export const examTimeslotRegistrations = pgTable(
    'exam_timeslot_registrations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        timeslotId: uuid('timeslot_id')
            .notNull()
            .references(() => examTimeslots.id, { onDelete: 'cascade' }),
        studentId: text('student_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_timeslot_registrations_timeslot_idx').on(t.timeslotId),
        unique('exam_timeslot_registrations_exam_student_uniq').on(t.examId, t.studentId),
    ],
);
