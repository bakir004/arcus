import type { QuestionOptionType as QuestionType } from "@/features/exams/types"

export type QuestionStatus = "unanswered" | "answered" | "flagged"

export interface ExamQuestion {
    id: string
    number: number
    title: string
    type: QuestionType
    points: number
    status: QuestionStatus
}
