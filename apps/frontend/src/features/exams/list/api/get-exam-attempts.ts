import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAttempt } from "@/features/exams/types"

export const getExamAttemptsRequest = (courseId: string, examId: string): Promise<ExamAttempt[]> =>
    apiClient<ExamAttempt[]>(`/courses/${courseId}/exams/${examId}/attempts/mine`)

export const useGetExamAttempts = (
    courseId: string | undefined,
    examId: string,
    studentId: string,
) =>
    useQuery<ExamAttempt[]>({
        queryKey: ["exam-attempts", courseId, examId, studentId],
        queryFn: () => {
            if (!courseId) throw new Error("Course id is required")
            return getExamAttemptsRequest(courseId, examId)
        },
        enabled: Boolean(courseId && examId && studentId),
    })
