import { createFileRoute } from "@tanstack/react-router"
import { ExamQuestionPage } from "@/features/exams/portal/components/exam-question-page"

export const Route = createFileRoute(
    "/exams/$examId/attempts/$attemptId/questions/$questionPosition",
)({
    component: function QuestionRoute() {
        const { examId, attemptId, questionPosition } = Route.useParams()
        return (
            <ExamQuestionPage
                examId={examId}
                attemptId={attemptId}
                questionPosition={questionPosition}
            />
        )
    },
})
