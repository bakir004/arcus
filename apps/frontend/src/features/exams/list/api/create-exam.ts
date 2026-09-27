import { apiClient } from "@/api/api-client"
import { ExamType, ExamVisibility, type Exam } from "@/features/exams/types"

export const createDraftExamRequest = (courseId: string, type: ExamType = ExamType.Written): Promise<Exam> =>
    apiClient<Exam>(`/courses/${courseId}/exams`, {
        method: "POST",
        body: {
            slug: `untitled-exam-${Date.now()}`,
            title: "Untitled exam",
            description: null,
            type,
            durationMinutes: 60,
            maxAttempts: 1,
            visibility: ExamVisibility.Draft,
        },
    })
