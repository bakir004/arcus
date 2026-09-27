import { apiClient } from "@/api/api-client"
import type { Exam, ExamItem, ExamQuestion, ExamTimeslot, QuestionOptions } from "@/features/exams/types"

export type ExamPatch = Partial<
    Pick<
        Exam,
        | "title"
        | "slug"
        | "description"
        | "durationMinutes"
        | "maxAttempts"
        | "visibility"
    >
>
export type QuestionCreate = {
    prompt: string
    position: number
    points: number
    options: QuestionOptions
}
export type QuestionPatch = Partial<QuestionCreate>

export async function getExamBuilderRequest(courseId: string, examId: string) {
    const [exam, questions, timeslots, items] = await Promise.all([
        apiClient<Exam>(`/courses/${courseId}/exams/${examId}`),
        apiClient<ExamQuestion[]>(`/courses/${courseId}/exams/${examId}/questions/authoring`),
        apiClient<ExamTimeslot[]>(`/courses/${courseId}/exams/${examId}/timeslots`),
        getExamItemsRequest(courseId, examId),
    ])
    return { exam: { ...exam, timeslots }, questions, items }
}

export const updateExamRequest = (courseId: string, examId: string, patch: ExamPatch) =>
    apiClient<Exam>(`/courses/${courseId}/exams/${examId}`, { method: "PATCH", body: patch })

export const createTimeslotRequest = (courseId: string, examId: string, input: Pick<ExamTimeslot, "location" | "startsAt" | "capacity">) =>
    apiClient<ExamTimeslot>(`/courses/${courseId}/exams/${examId}/timeslots`, { method: "POST", body: input })
export const updateTimeslotRequest = (courseId: string, examId: string, id: string, input: Partial<Pick<ExamTimeslot, "location" | "startsAt" | "capacity">>) =>
    apiClient<ExamTimeslot>(`/courses/${courseId}/exams/${examId}/timeslots/${id}`, { method: "PATCH", body: input })
export const deleteTimeslotRequest = (courseId: string, examId: string, id: string) =>
    apiClient<void>(`/courses/${courseId}/exams/${examId}/timeslots/${id}`, { method: "DELETE" })

export const getExamItemsRequest = (courseId: string, examId: string) =>
    apiClient<ExamItem[]>(`/courses/${courseId}/exams/${examId}/questions/items`)
export const createExamItemRequest = (courseId: string, examId: string, input: { position: number; maxPoints: number; label?: string; prompt?: string }) =>
    apiClient<ExamItem>(`/courses/${courseId}/exams/${examId}/questions/items`, { method: "POST", body: input })
export const updateExamItemRequest = (courseId: string, examId: string, id: string, input: Partial<Pick<ExamItem, "label" | "maxPoints" | "prompt" | "position">>) =>
    apiClient<ExamItem>(`/courses/${courseId}/exams/${examId}/questions/items/${id}`, { method: "PATCH", body: input })
export const deleteExamItemRequest = (courseId: string, examId: string, id: string) =>
    apiClient<void>(`/courses/${courseId}/exams/${examId}/questions/items/${id}`, { method: "DELETE" })

export const createQuestionRequest = (courseId: string, examId: string, input: QuestionCreate) =>
    apiClient<ExamQuestion>(`/courses/${courseId}/exams/${examId}/questions`, {
        method: "POST",
        body: input,
    })

export const reorderQuestionsRequest = (
    courseId: string,
    examId: string,
    questionIds: string[],
) =>
    apiClient<ExamQuestion[]>(`/courses/${courseId}/exams/${examId}/questions/reorder`, {
        method: "PATCH",
        body: { questionIds },
    })

export const updateQuestionRequest = (
    courseId: string,
    examId: string,
    questionId: string,
    patch: QuestionPatch,
) =>
    apiClient<ExamQuestion>(`/courses/${courseId}/exams/${examId}/questions/${questionId}`, {
        method: "PATCH",
        body: patch,
    })

export const deleteQuestionRequest = (courseId: string, examId: string, questionId: string) =>
    apiClient<void>(`/courses/${courseId}/exams/${examId}/questions/${questionId}`, {
        method: "DELETE",
    })
