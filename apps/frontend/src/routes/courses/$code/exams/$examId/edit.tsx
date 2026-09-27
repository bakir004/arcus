import { createFileRoute } from "@tanstack/react-router"
import { ExamBuilderPage } from "@/features/exams/coding/components/exam-builder-page"
import { courseByCodeOptions } from "@/features/courses/api/get-course"
import { queryClient } from "@/lib/query-client"

export const Route = createFileRoute("/courses/$code/exams/$examId/edit")({
    loader: async ({ params }) => ({
        course: await queryClient.ensureQueryData(courseByCodeOptions(params.code)),
    }),
    component: EditExamRoute,
})

function EditExamRoute() {
    const { examId } = Route.useParams()
    const { course } = Route.useLoaderData()
    return <ExamBuilderPage courseId={course.id} courseCode={Route.useParams().code} examId={examId} />
}
