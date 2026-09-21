import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import { getCoursesRequest } from "@/features/courses/api/get-courses"
import type { Exam, ExamTimeslot } from "@/features/exams/types"

export const getCourseExamsRequest = async (courseId: string): Promise<Exam[]> => {
    const exams = await apiClient<Exam[]>(`/courses/${courseId}/exams`)
    return Promise.all(exams.map(async (exam) => ({
        ...exam,
        timeslots: await apiClient<ExamTimeslot[]>(`/courses/${courseId}/exams/${exam.id}/timeslots`),
    })))
}

export const getExamsRequest = async (): Promise<Exam[]> => {
    const courses = await getCoursesRequest()
    const results = await Promise.allSettled(
        courses.map((course) => getCourseExamsRequest(course.id)),
    )

    const exams = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    return Array.from(new Map(exams.map((exam) => [exam.id, exam])).values())
}

export const useGetExams = () =>
    useQuery<Exam[]>({
        queryKey: ["exams"],
        queryFn: getExamsRequest,
    })
