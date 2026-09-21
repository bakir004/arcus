import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAnswer } from "@/features/exams/types"

type GradeAnswerPayload = {
    score: number
    feedback?: string
    gradedBy: string
}

export const gradeAnswerRequest = (
    courseId: string,
    examId: string,
    attemptId: string,
    questionId: string,
    payload: GradeAnswerPayload,
) =>
    apiClient<ExamAnswer>(
        `/courses/${courseId}/exams/${examId}/attempts/${attemptId}/answers/${questionId}/grade`,
        {
            method: "PUT",
            body: payload,
        },
    )

export const useGradeAnswer = (
    courseId: string | undefined,
    examId: string,
    attemptId: string | null,
) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            questionId,
            payload,
        }: {
            questionId: string
            payload: GradeAnswerPayload
        }) => gradeAnswerRequest(courseId!, examId, attemptId as string, questionId, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["exam-attempt-with-answers", courseId, examId, attemptId],
            })
            void queryClient.invalidateQueries({
                queryKey: ["exam-attempts", courseId, examId],
            })
        },
    })
}
