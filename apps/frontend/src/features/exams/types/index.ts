export const QuestionOptionType = {
    MultipleChoice: "multiple_choice",
    Coding: "coding",
    Essay: "essay",
} as const

export type QuestionOptionType = (typeof QuestionOptionType)[keyof typeof QuestionOptionType]

export const CodingLanguage = {
    Cpp: "cpp",
    Java: "java",
    JavaScript: "javascript",
    Python: "python",
    Sql: "sql",
} as const

export type CodingLanguage = (typeof CodingLanguage)[keyof typeof CodingLanguage]

export const ExamType = {
    Verbal: "verbal",
    Written: "written",
    Online: "online",
} as const

export type ExamType = (typeof ExamType)[keyof typeof ExamType]

export const ExamVisibility = {
    Draft: "draft",
    Published: "published",
} as const

export type ExamVisibility = (typeof ExamVisibility)[keyof typeof ExamVisibility]

export const ExamAttemptStatus = {
    InProgress: "in_progress",
    Submitted: "submitted",
    Graded: "graded",
} as const

export type ExamAttemptStatus = (typeof ExamAttemptStatus)[keyof typeof ExamAttemptStatus]

export type MultipleChoiceOptions = {
    type: typeof QuestionOptionType.MultipleChoice
    choices: string[]
    correctIndices: number[]
    multipleAnswers?: boolean
}

export type CodingTestCase = {
    id?: string
    name?: string
    input?: string
    expectedOutput?: string
    code?: string
    expectedStdout?: string
    slots?: Record<string, string>
}

export type CodingOptions = {
    type: typeof QuestionOptionType.Coding
    language: CodingLanguage
    mode?: string
    initialCode?: string
    professorCode?: string
    studentCodeTemplate?: string
    testCodeTemplate?: string
    templates?: {
        studentCode?: string
        testCode?: string
    }
    slots?: Record<string, string>
    testCases: CodingTestCase[]
}

export type EssayOptions = {
    type: typeof QuestionOptionType.Essay
}

export type QuestionOptions = MultipleChoiceOptions | CodingOptions | EssayOptions

export interface ExamTimeslot {
    id: string
    examId: string
    location: "A-101" | "A-102" | "B-201" | "C-301" | "Main hall"
    startsAt: string
    capacity: number
    registrationCount: number
    availableSeats: number
    isRegistered: boolean
    registrationDueAt?: string | null
    comment?: string | null
    createdAt: string
    updatedAt: string
}

export interface Exam {
    id: string
    courseId: string
    createdById: string
    slug: string
    title: string
    description: string | null
    type: ExamType
    durationMinutes: number
    maxAttempts: number
    timeslots?: ExamTimeslot[]
    visibility: ExamVisibility
    createdAt: string
    updatedAt: string
}

export interface ExamAttempt {
    id: string
    examId: string
    studentId: string
    status: ExamAttemptStatus
    score: number | null
    startedAt: string
    submittedAt: string | null
}

export type QuestionAnswerPayload =
    | { type: typeof QuestionOptionType.MultipleChoice; selectedIndices: number[] }
    | { type: typeof QuestionOptionType.Essay; text: string }
    | { type: typeof QuestionOptionType.Coding; code: string; language: CodingLanguage }

export interface ExamAnswer {
    id: string
    attemptId: string
    questionId: string
    answer: QuestionAnswerPayload
    score: string | null
    feedback: string | null
    gradedAt: string | null
    gradedBy: string | null
    createdAt: string
    updatedAt: string
}

export interface ExamAttemptWithAnswers extends ExamAttempt {
    answers: ExamAnswer[]
}

export interface ExamItem {
    id: string
    examId: string
    position: number
    label: string | null
    maxPoints: string
    prompt: string | null
    createdAt: string
    updatedAt: string
}

export interface ExamQuestion {
    id: string
    examItemId: string
    examId: string
    prompt: string
    points: string
    position: number
    options: QuestionOptions
    createdAt: string
}

export interface ExamAnnouncement {
    id: string
    examId: string
    title: string
    message: string
    createdAt: string
    updatedAt: string
}

export interface ExamAnswerTableQuestion {
    id: string
    position: number
    prompt: string
}

export interface CodingExecutionTestResult {
    id?: string
    name?: string
    stdout?: string
    stderr?: string
    error?: string
    expectedOutput?: string
    assembledCode?: string
    passed: boolean
    timedOut?: boolean
    exitCode?: number | null
}

export interface CodingExecutionResult {
    mode: string
    passed: boolean
    compile: CodingExecutionTestResult
    tests: CodingExecutionTestResult[]
}

export interface ExamAnswerTableCell {
    questionId: string
    position: number
    type: QuestionOptionType
    answer: Record<string, unknown>
    score: string | null
    feedback: string | null
    gradedAt: string | null
    gradedBy: string | null
    executionResult?: CodingExecutionResult
    executedAt?: string
}

export interface ExamAnswerTableRow {
    attemptId: string
    studentId: string
    studentName: string
    studentFacultyIndex: string | null
    answers: ExamAnswerTableCell[]
}

export interface ExamAnswerTable {
    questions: ExamAnswerTableQuestion[]
    rows: ExamAnswerTableRow[]
}
