import { requireAuth } from "@/features/auth/lib/guards"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/exams/$examId")({
    loader: requireAuth,
    component: () => <Outlet />,
})
