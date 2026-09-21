import { createFileRoute } from "@tanstack/react-router"
import ExamPortalPage from "@/features/exams/portal/pages/exam-portal-page"

export const Route = createFileRoute("/exams/$examId/attempts/$attemptId")({
    component: function AttemptRoute() {
        const { examId, attemptId } = Route.useParams()
        return <ExamPortalPage examId={examId} attemptId={attemptId} />
    },
})
