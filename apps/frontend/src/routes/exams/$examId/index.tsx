import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/exams/$examId/")({
    loader: async ({ params }) => {
        throw redirect({
            to: "/exams/$examId/start",
            params: { examId: params.examId },
        })
    },
    component: () => null,
})
