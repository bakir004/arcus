import { pgEnum } from 'drizzle-orm/pg-core';

export enum ExamVisibility {
    Draft = 'draft',
    Published = 'published',
}

export const examVisibilityEnum = pgEnum('exam_visibility', ExamVisibility);
export const EXAM_VISIBILITIES = [...examVisibilityEnum.enumValues];

export enum ExamType {
    Verbal = 'verbal',
    Written = 'written',
    Online = 'online',
}

export const examTypeEnum = pgEnum('exam_type', ExamType);
export const EXAM_TYPES = [...examTypeEnum.enumValues];

export enum QuestionType {
    MultipleChoice = 'multiple_choice',
    Essay = 'essay',
    Coding = 'coding',
}

export const questionTypeEnum = pgEnum('question_type', QuestionType);
export const QUESTION_TYPES = [...questionTypeEnum.enumValues];

export enum AttemptStatus {
    Registered = 'registered',
    InProgress = 'in_progress',
    Submitted = 'submitted',
    Graded = 'graded',
    Absent = 'absent',
    Withdrawn = 'withdrawn',
}

export const attemptStatusEnum = pgEnum('attempt_status', AttemptStatus);
export const ATTEMPT_STATUSES = [...attemptStatusEnum.enumValues];

export enum CodingLanguage {
    Cpp = 'cpp',
    JavaScript = 'javascript',
    Java = 'java',
    Python = 'python',
    Sql = 'sql',
}

export const codingLanguageEnum = pgEnum('coding_language', CodingLanguage);
export const CODING_LANGUAGES = [...codingLanguageEnum.enumValues];
