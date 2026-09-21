import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { QuestionAnswerPayload } from "@/features/exams/types"

export type AnswerPayload = QuestionAnswerPayload

export const useSaveAnswer = (courseId: string, examId: string, attemptId: string) =>
    useMutation({
        mutationFn: ({
            questionId,
            answer,
        }: {
            questionId: string
            answer: QuestionAnswerPayload
        }) =>
            apiClient(
                `/courses/${courseId}/exams/${examId}/attempts/${attemptId}/answers/${questionId}`,
                {
                    method: "PUT",
                    body: { answer },
                },
            ),
    })
