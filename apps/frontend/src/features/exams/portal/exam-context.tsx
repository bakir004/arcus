import * as React from "react"
import type { editor } from "monaco-editor"
import type { Exam, ExamQuestion, QuestionAnswerPayload } from "@/features/exams/types"
import type { TestCase } from "./components/coding/exam-coding"

interface ExamContextValue {
    exam: Exam
    questions: ExamQuestion[]
    attemptId: string
    activeQuestionPosition: number | null
    setActiveQuestionPosition: (position: number | null) => void
    mcqAnswers: Record<string, string[]>
    essayAnswers: Record<string, string>
    flagged: Record<string, boolean>
    testResults: Record<string, TestCase[]>
    codeAnswers: React.RefObject<Record<string, string>>
    activeEditor: React.RefObject<editor.IStandaloneCodeEditor | null>
    setMcqAnswer: (qId: string, val: string[]) => void
    setEssayAnswer: (qId: string, val: string) => void
    toggleFlagged: (qId: string) => void
    setTestResults: (qId: string, results: TestCase[]) => void
    saveAnswer: (questionId: string, overrideAnswer?: QuestionAnswerPayload) => void
}

export const ExamContext = React.createContext<ExamContextValue | null>(null)

export function useExamContext() {
    const ctx = React.useContext(ExamContext)
    if (!ctx) throw new Error("useExamContext must be used within ExamPortalShell")
    return ctx
}
