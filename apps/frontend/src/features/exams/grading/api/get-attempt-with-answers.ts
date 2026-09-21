import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAnswer, ExamAttempt, ExamAttemptWithAnswers } from "@/features/exams/types"

export const getAttemptWithAnswersRequest = (
    courseId: string,
    examId: string,
    attemptId: string,
): Promise<ExamAttemptWithAnswers> =>
    Promise.all([
        apiClient<ExamAttempt>(`/courses/${courseId}/exams/${examId}/attempts/${attemptId}`),
        apiClient<ExamAnswer[]>(
            `/courses/${courseId}/exams/${examId}/attempts/${attemptId}/answers`,
        ),
    ]).then(([attempt, answers]) => ({
        ...attempt,
        answers,
    }))

export const useGetAttemptWithAnswers = (
    courseId: string | undefined,
    examId: string,
    attemptId: string | null,
) =>
    useQuery<ExamAttemptWithAnswers>({
        queryKey: ["exam-attempt-with-answers", courseId, examId, attemptId],
        queryFn: () => getAttemptWithAnswersRequest(courseId!, examId, attemptId as string),
        enabled: Boolean(courseId && attemptId),
    })
