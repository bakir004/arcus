import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAttemptStatus } from "@/features/exams/types"

interface StartAttemptResponse {
    id: string
    examId: string
    studentId: string
    status: ExamAttemptStatus
    score: number | null
    startedAt: string
    submittedAt: string | null
}

export const useStartAttempt = (courseId: string | undefined, examId: string) =>
    useMutation({
        mutationFn: (studentId: string) =>
            apiClient<StartAttemptResponse>(`/courses/${courseId}/exams/${examId}/attempts`, {
                method: "POST",
                body: { studentId },
            }),
    })
