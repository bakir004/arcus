import {
    boolean,
    index,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { codingLanguageEnum, questionTypeEnum } from './enums.schema';
import { exams } from './exams.schema';

export const examQuestions = pgTable(
    'exam_questions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        examId: uuid('exam_id')
            .notNull()
            .references(() => exams.id, { onDelete: 'cascade' }),
        prompt: text('prompt').notNull(),
        points: numeric('points', { precision: 6, scale: 2 }).notNull(),
        position: integer('position').notNull(),
        type: questionTypeEnum('type').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        index('exam_questions_exam_id_idx').on(t.examId),
        unique('exam_questions_exam_position_uniq').on(t.examId, t.position),
    ],
);

export const examQuestionMultipleChoiceChoices = pgTable(
    'exam_question_multiple_choice_choices',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        questionId: uuid('question_id')
            .notNull()
            .references(() => examQuestions.id, { onDelete: 'cascade' }),
        choiceText: varchar('choice_text', { length: 512 }).notNull(),
        position: integer('position').notNull(),
        isCorrect: boolean('is_correct').notNull(),
    },
    (t) => [
        index('exam_q_mc_choices_question_id_idx').on(t.questionId),
        unique('exam_q_mc_choices_question_position_uniq').on(t.questionId, t.position),
    ],
);

export const examQuestionCodingTestCases = pgTable(
    'exam_question_coding_test_cases',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        questionId: uuid('question_id')
            .notNull()
            .references(() => examQuestions.id, { onDelete: 'cascade' }),
        input: text('input').notNull(),
        expectedOutput: text('expected_output').notNull(),
        name: text('name'),
        code: text('code'),
        position: integer('position').notNull(),
    },
    (t) => [
        index('exam_q_coding_cases_question_id_idx').on(t.questionId),
        unique('exam_q_coding_cases_question_position_uniq').on(t.questionId, t.position),
    ],
);

export const examQuestionCodingConfigs = pgTable('exam_question_coding_configs', {
    questionId: uuid('question_id')
        .primaryKey()
        .references(() => examQuestions.id, { onDelete: 'cascade' }),
    language: codingLanguageEnum('language').notNull(),
    mode: text('mode'),
    initialCode: text('initial_code'),
    solutionCode: text('solution_code'),
    studentCodeTemplate: text('student_code_template'),
    testCodeTemplate: text('test_code_template'),
});

export const examQuestionEssayConfigs = pgTable('exam_question_essay_configs', {
    questionId: uuid('question_id')
        .primaryKey()
        .references(() => examQuestions.id, { onDelete: 'cascade' }),
});
