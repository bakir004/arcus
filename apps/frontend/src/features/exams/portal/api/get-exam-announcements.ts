import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/api-client"
import type { ExamAnnouncement } from "@/features/exams/types"

export const getExamAnnouncementsRequest = (
    courseId: string,
    examId: string,
): Promise<ExamAnnouncement[]> =>
    apiClient<ExamAnnouncement[]>(`/courses/${courseId}/exams/${examId}/announcements`)

export const useGetExamAnnouncements = (courseId: string | undefined, examId: string) =>
    useQuery<ExamAnnouncement[]>({
        queryKey: ["courses", courseId, "exams", examId, "announcements"],
        queryFn: () => getExamAnnouncementsRequest(courseId!, examId),
        enabled: Boolean(courseId && examId),
        refetchInterval: 15000,
    })
