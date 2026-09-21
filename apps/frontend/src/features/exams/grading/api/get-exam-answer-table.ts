import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAnswerTable } from "@/features/exams/types"

export const getExamAnswerTableRequest = (
    courseId: string,
    examId: string,
): Promise<ExamAnswerTable> =>
    apiClient<ExamAnswerTable>(`/courses/${courseId}/exams/${examId}/answers/table`)

export const useGetExamAnswerTable = (courseId: string | undefined, examId: string) =>
    useQuery<ExamAnswerTable>({
        queryKey: ["exam-answer-table", courseId, examId],
        queryFn: () => getExamAnswerTableRequest(courseId!, examId),
        enabled: Boolean(courseId && examId),
    })
