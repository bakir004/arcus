import { Box, Group, Stack, Text } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import type { ExamQuestion as SidebarQuestion } from "@/features/exams/portal/types/question-sidebar-types"

const SUBMIT_UNLOCK_SECONDS = 5

interface ExamSubmitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    questions: SidebarQuestion[]
    isSubmitting: boolean
    canSubmit: boolean
    onSubmit: () => void
}

export function ExamSubmitDialog({
    open,
    onOpenChange,
    questions,
    isSubmitting,
    canSubmit,
    onSubmit,
}: ExamSubmitDialogProps) {
    const [secondsUntilSubmit, setSecondsUntilSubmit] = useState(SUBMIT_UNLOCK_SECONDS)

    useEffect(() => {
        if (!open) {
            setSecondsUntilSubmit(SUBMIT_UNLOCK_SECONDS)
            return
        }

        setSecondsUntilSubmit(SUBMIT_UNLOCK_SECONDS)
        const interval = window.setInterval(() => {
            setSecondsUntilSubmit((seconds) => Math.max(0, seconds - 1))
        }, 1000)

        return () => window.clearInterval(interval)
    }, [open])

    const isSubmitLocked = secondsUntilSubmit > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit exam?</DialogTitle>
                    <DialogDescription>
                        Quick review before submitting. You won’t be able to keep editing after
                        submission.
                    </DialogDescription>
                </DialogHeader>

                <Stack gap={2} className="scrollbar-thin max-h-80 overflow-y-auto">
                    <Text as="p" size="sm" className="font-medium">
                        Answered: {questions.filter((q) => q.status === "answered").length}/
                        {questions.length}
                    </Text>
                    <Box className="grid grid-cols-2 gap-2">
                        {questions.map((q) => (
                            <Group
                                key={q.id}
                                justify="between"
                                align="center"
                                className="rounded-md border px-2 py-1"
                            >
                                <Text as="span" size="sm">
                                    Q{q.number}
                                </Text>
                                <Text
                                    as="span"
                                    size="sm"
                                    className={
                                        q.status === "answered"
                                            ? "text-success"
                                            : q.status === "flagged"
                                              ? "text-warning"
                                              : "text-muted-foreground"
                                    }
                                >
                                    {q.status === "answered"
                                        ? "Answered"
                                        : q.status === "flagged"
                                          ? "Flagged"
                                          : "Not answered"}
                                </Text>
                            </Group>
                        ))}
                    </Box>
                </Stack>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Continue editing
                    </Button>
                    <Button onClick={onSubmit} disabled={isSubmitting || !canSubmit || isSubmitLocked}>
                        {isSubmitting
                            ? "Submitting..."
                            : isSubmitLocked
                              ? `Submit in ${secondsUntilSubmit}s`
                              : "Submit now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
