import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAttempt } from "@/features/exams/types"

export const getAttemptRequest = (
    courseId: string,
    examId: string,
    attemptId: string,
): Promise<ExamAttempt> =>
    apiClient<ExamAttempt>(`/courses/${courseId}/exams/${examId}/attempts/${attemptId}`)

export const useGetAttempt = (courseId: string | undefined, examId: string, attemptId: string) =>
    useQuery<ExamAttempt>({
        queryKey: ["exam-attempt", courseId, examId, attemptId],
        queryFn: () => {
            if (!courseId) throw new Error("courseId is required")
            return getAttemptRequest(courseId, examId, attemptId)
        },
        enabled: Boolean(courseId && examId && attemptId),
        retry: 6,
        retryDelay: 500,
    })
