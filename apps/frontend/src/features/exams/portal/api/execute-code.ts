import { apiClient } from "@/api/api-client"

export interface ExecuteCodeTestInput {
    id?: string
    name?: string
    input?: string
    expectedOutput?: string
    code?: string
    expectedStdout?: string
    slots?: Record<string, string>
}

export interface ExecuteCodeInput {
    questionId?: string
    mode?: string
    studentCode: string
    professorCode?: string
    studentCodeTemplate?: string
    testCodeTemplate?: string
    templates?: {
        studentCode?: string
        testCode?: string
    }
    slots?: Record<string, string>
    tests: ExecuteCodeTestInput[]
}

export interface ExecuteCodeTestResult {
    id?: string
    name?: string
    stdout: string
    stderr: string
    exitCode: number | null
    timedOut: boolean
    passed: boolean
    error?: string
}

export interface ExecuteCodeResult {
    mode: string
    passed: boolean
    compile: ExecuteCodeTestResult
    tests: ExecuteCodeTestResult[]
}

export interface ExecuteCodeContext {
    courseId: string
    examId: string
    attemptId: string
    questionId: string
}

function executionPath(context: ExecuteCodeContext) {
    return `/courses/${context.courseId}/exams/${context.examId}/attempts/${context.attemptId}/questions/${context.questionId}/execute`
}

export function compileCodeRequest(context: ExecuteCodeContext, input: ExecuteCodeInput): Promise<ExecuteCodeResult> {
    return apiClient<ExecuteCodeResult>(`${executionPath(context)}/compile`, {
        method: "POST",
        body: input,
    })
}

export function executeCodeRequest(context: ExecuteCodeContext, input: ExecuteCodeInput): Promise<ExecuteCodeResult> {
    return apiClient<ExecuteCodeResult>(executionPath(context), {
        method: "POST",
        body: input,
    })
}
