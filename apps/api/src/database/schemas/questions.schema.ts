import {
    boolean,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { codingLanguageEnum, questionTypeEnum } from './enums.schema';
import { examItems } from './exams.schema';

/** Platform-known question content. An exam item may exist without this row. */
export const examQuestions = pgTable(
    'exam_questions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examItemId: uuid('exam_item_id')
            .notNull()
            .references(() => examItems.id, { onDelete: 'cascade' }),
        type: questionTypeEnum('type').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_questions_exam_item_id_idx').on(t.examItemId),
        unique('exam_questions_exam_item_uniq').on(t.examItemId),
    ],
);

export const examItemStatements = pgTable(
    'exam_item_statements',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examItemId: uuid('exam_item_id')
            .notNull()
            .references(() => examItems.id, { onDelete: 'cascade' }),
        prompt: text('prompt').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [unique('exam_item_statements_exam_item_uniq').on(t.examItemId)],
);

export const examQuestionMultipleChoiceChoices = pgTable(
    'exam_question_multiple_choice_choices',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        questionId: uuid('question_id').notNull(),
        choiceText: varchar('choice_text', { length: 512 }).notNull(),
        position: integer('position').notNull(),
        isCorrect: boolean('is_correct').notNull(),
    },
    (t) => [
        index('exam_q_mc_choices_question_id_idx').on(t.questionId),
        unique('exam_q_mc_choices_question_position_uniq').on(t.questionId, t.position),
        foreignKey({
            columns: [t.questionId],
            foreignColumns: [examQuestions.id],
            name: 'exam_q_mc_choices_question_fk',
        }).onDelete('cascade'),
    ],
);

export const examQuestionCodingTestCases = pgTable(
    'exam_question_coding_test_cases',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        questionId: uuid('question_id').notNull(),
        input: text('input').notNull(),
        expectedOutput: text('expected_output').notNull(),
        name: text('name'),
        code: text('code'),
        position: integer('position').notNull(),
        expectedStdout: text('expected_stdout'),
        slots: jsonb('slots').$type<Record<string, string>>(),
    },
    (t) => [
        index('exam_q_coding_cases_question_id_idx').on(t.questionId),
        unique('exam_q_coding_cases_question_position_uniq').on(t.questionId, t.position),
        foreignKey({
            columns: [t.questionId],
            foreignColumns: [examQuestions.id],
            name: 'exam_q_coding_cases_question_fk',
        }).onDelete('cascade'),
    ],
);

export const examQuestionCodingConfigs = pgTable('exam_question_coding_configs', {
    questionId: uuid('question_id')
        .primaryKey()
        .references(() => examQuestions.id, { onDelete: 'cascade' }),
    language: codingLanguageEnum('language').notNull(),
    mode: text('mode'),
    initialCode: text('initial_code'),
    professorCode: text('professor_code'),
    studentCodeTemplate: text('student_code_template'),
    testCodeTemplate: text('test_code_template'),
    templates: jsonb('templates').$type<{ studentCode?: string; testCode?: string }>(),
    slots: jsonb('slots').$type<Record<string, string>>(),
});

export const examQuestionEssayConfigs = pgTable('exam_question_essay_configs', {
    questionId: uuid('question_id')
        .primaryKey()
        .references(() => examQuestions.id, { onDelete: 'cascade' }),
});
