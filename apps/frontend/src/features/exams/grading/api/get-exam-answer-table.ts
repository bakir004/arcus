import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAnswerTable } from "@/features/exams/types"

type AnswerTableResponse = {
    items: Array<{ id: string; position: number; prompt: string | null }>
    rows: Array<{
        attemptId: string
        studentId: string
        studentName: string
        studentFacultyIndex: string | null
        answers: Array<ExamAnswerTable["rows"][number]["answers"][number] & { examItemId?: string }>
    }>
}

export const getExamAnswerTableRequest = async (
    courseId: string,
    examId: string,
): Promise<ExamAnswerTable> => {
    const response = await apiClient<AnswerTableResponse>(
        `/courses/${courseId}/exams/${examId}/answers/table`,
    )

    // The API calls exam questions "items" and answers reference them by
    // examItemId, while the grading UI uses the normalized questionId name.
    return {
        questions: (response.items ?? []).map((item) => ({
            ...item,
            prompt: item.prompt ?? "",
        })),
        rows: (response.rows ?? []).map((row) => ({
            ...row,
            answers: (row.answers ?? []).map((answer) => ({
                ...answer,
                questionId: answer.questionId ?? answer.examItemId ?? "",
            })),
        })),
    }
}

export const useGetExamAnswerTable = (courseId: string | undefined, examId: string) =>
    useQuery<ExamAnswerTable>({
        queryKey: ["exam-answer-table", courseId, examId],
        queryFn: () => getExamAnswerTableRequest(courseId!, examId),
        enabled: Boolean(courseId && examId),
    })
