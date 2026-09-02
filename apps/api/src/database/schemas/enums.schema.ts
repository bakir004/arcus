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
