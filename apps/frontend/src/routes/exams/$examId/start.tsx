import { createFileRoute } from "@tanstack/react-router"
import { ExamStartPage } from "@/features/exams/portal/pages/exam-start-page"

export const Route = createFileRoute("/exams/$examId/start")({
    component: function ExamStartRoute() {
        const { examId } = Route.useParams()
        return <ExamStartPage examId={examId} />
    },
})
