import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"

export const useSubmitAttempt = (courseId: string, examId: string, attemptId: string) =>
    useMutation({
        mutationFn: () =>
            apiClient(`/courses/${courseId}/exams/${examId}/attempts/${attemptId}/submit`, {
                method: "POST",
            }),
    })
