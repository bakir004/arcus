import { createFileRoute } from "@tanstack/react-router"
import { BoxIcon } from "lucide-react"

export const Route = createFileRoute("/exams/$examId/attempts/$attemptId/questions/")({
    component: function QuestionsIndexRoute() {
        return (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <BoxIcon className="size-10 opacity-70" />
                <div>
                    <p className="text-foreground text-base font-medium">No question selected</p>
                    <p className="text-sm">Select a question from the sidebar to continue.</p>
                </div>
            </div>
        )
    },
})
