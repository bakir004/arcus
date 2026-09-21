import { apiClient } from "@/api/api-client"
import type { AnswerPayload } from "./save-answer"

export interface BulkAnswerItem {
    examItemId: string
    answer: AnswerPayload
}

export function bulkSaveAnswersRequest(
    courseId: string,
    examId: string,
    attemptId: string,
    answers: BulkAnswerItem[],
) {
    return apiClient(`/courses/${courseId}/exams/${examId}/attempts/${attemptId}/answers`, {
        method: "PUT",
        body: { answers },
    })
}
