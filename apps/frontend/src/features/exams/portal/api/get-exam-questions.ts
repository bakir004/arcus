import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamQuestion } from "@/features/exams/types"

export const getExamQuestionsRequest = (
    courseId: string,
    examId: string,
): Promise<ExamQuestion[]> =>
    apiClient<ExamQuestion[]>(`/courses/${courseId}/exams/${examId}/questions`)

export const useGetExamQuestions = (courseId: string | undefined, examId: string) =>
    useQuery<ExamQuestion[]>({
        queryKey: ["courses", courseId, "exams", examId, "questions"],
        queryFn: () => getExamQuestionsRequest(courseId!, examId),
        enabled: Boolean(courseId && examId),
        refetchInterval: 15000,
    })

export const useGetExamQuestionsForAuthoring = (courseId: string | undefined, examId: string) =>
    useQuery<ExamQuestion[]>({
        queryKey: ["courses", courseId, "exams", examId, "questions", "authoring"],
        queryFn: () => apiClient<ExamQuestion[]>(`/courses/${courseId}/exams/${examId}/questions/authoring`),
        enabled: Boolean(courseId && examId),
        refetchInterval: 15000,
    })
