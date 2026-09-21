import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import { getExamsRequest } from "@/features/exams/list/api/get-exams"
import type { Exam } from "@/features/exams/types"

export const getExamRequest = async (id: string): Promise<Exam> => {
    const exams = await getExamsRequest()
    const exam = exams.find((item) => item.id === id)
    if (!exam) throw new Error("Exam not found")
    return exam
}

export const getCourseExamRequest = (courseId: string, id: string): Promise<Exam> =>
    apiClient<Exam>(`/courses/${courseId}/exams/${id}`)

export const useGetExam = (id: string) =>
    useQuery<Exam>({
        queryKey: ["exams", id],
        queryFn: () => getExamRequest(id),
        enabled: !!id,
        refetchInterval: 15000,
    })
