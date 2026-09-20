import { index, integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { questionTypeEnum } from './enums.schema';
import { examItems } from './exams.schema';
import { examAttempts } from './attempts.schema';

/** Optional student work. Written/oral exams may have no answer row. */
export const examAnswers = pgTable(
    'exam_answers',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        attemptId: uuid('attempt_id')
            .notNull()
            .references(() => examAttempts.id, { onDelete: 'cascade' }),
        examItemId: uuid('exam_item_id')
            .notNull()
            .references(() => examItems.id, { onDelete: 'cascade' }),
        type: questionTypeEnum('type').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_answers_attempt_id_idx').on(t.attemptId),
        unique('exam_answers_attempt_item_uniq').on(t.attemptId, t.examItemId),
    ],
);

export const examMultipleChoiceAnswerSelections = pgTable(
    'exam_multiple_choice_answer_selections',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        answerId: uuid('answer_id')
            .notNull()
            .references(() => examAnswers.id, { onDelete: 'cascade' }),
        selectedIndex: integer('selected_index').notNull(),
    },
    (t) => [
        index('exam_mc_answer_selections_answer_id_idx').on(t.answerId),
        unique('exam_mc_answer_selections_answer_index_uniq').on(t.answerId, t.selectedIndex),
    ],
);

export const examEssayAnswers = pgTable('exam_essay_answers', {
    answerId: uuid('answer_id')
        .primaryKey()
        .references(() => examAnswers.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
});

export const examCodingAnswers = pgTable('exam_coding_answers', {
    answerId: uuid('answer_id')
        .primaryKey()
        .references(() => examAnswers.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    language: varchar('language', { length: 64 }).notNull(),
});
