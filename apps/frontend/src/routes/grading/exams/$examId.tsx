import { createFileRoute } from "@tanstack/react-router"
import { ExamGradingPage } from "@/features/exams/grading/components/exam-grading-page"
import { requireAuth } from "@/features/auth/lib/guards"

export const Route = createFileRoute("/grading/exams/$examId")({
    loader: requireAuth,
    component: function GradingExamRoute() {
        const { examId } = Route.useParams()
        return <ExamGradingPage examId={examId} />
    },
})
