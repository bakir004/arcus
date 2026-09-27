import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { CalendarClock, Clock, FileText, Play } from "lucide-react"
import { toast } from "sonner"
import { Group, Heading, Stack, Text } from "@/components/common"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/lib/use-auth"
import { useGetExamAttempts } from "@/features/exams/list/api/get-exam-attempts"
import { ExamAttemptStatus } from "@/features/exams/types"
import { useGetExam } from "@/features/exams/portal/api/get-exam"
import { useGetExamQuestions } from "@/features/exams/portal/api/get-exam-questions"
import { useStartAttempt } from "@/features/exams/portal/api/start-attempt"
import type { ApiError } from "@/types/error"

export function ExamStartPage({ examId }: { examId: string }) {
    const navigate = useNavigate()
    const { userId } = useAuth()
    const { data: exam, isLoading: examLoading } = useGetExam(examId)
    const courseId = exam?.courseId
    const resolvedExamId = exam?.id ?? ""
    const startAttempt = useStartAttempt(courseId, resolvedExamId)
    const { data: questions = [], isLoading: questionsLoading } = useGetExamQuestions(
        courseId,
        resolvedExamId,
    )
    const { data: attempts = [] } = useGetExamAttempts(courseId, resolvedExamId, userId)

    const liveAttempt = attempts
        .filter((attempt) => attempt.studentId === userId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .find((attempt) => attempt.status === ExamAttemptStatus.InProgress)
    const usedAttempts = attempts.filter((attempt) => attempt.studentId === userId).length
    const maxAttemptsReached = !liveAttempt && usedAttempts >= (exam?.maxAttempts ?? 1)
    const totalPoints = questions.reduce((sum, question) => sum + Number(question.points), 0)

    const [now, setNow] = React.useState(() => Date.now())

    React.useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(timer)
    }, [])

    function formatStartsAt(value: string): string {
        return new Date(value).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        })
    }

    async function handleStart() {
        if (!userId || startAttempt.isPending || maxAttemptsReached || !isWithinWindow) return
        try {
            const attempt = await startAttempt.mutateAsync(userId)
            navigate({
                to: "/exams/$examId/attempts/$attemptId",
                params: {
                    examId,
                    attemptId: attempt.id,
                },
            })
        } catch (error) {
            const err = error as ApiError
            toast.error(
                err.message.join("\n") || "Failed to start the exam attempt. Please try again.",
            )
        }
    }

    function handleContinue() {
        if (!liveAttempt || isAfterClose) return
        navigate({
            to: "/exams/$examId/attempts/$attemptId",
            params: {
                examId,
                attemptId: liveAttempt.id,
            },
        })
    }

    if (examLoading || questionsLoading || !exam) {
        return (
            <div className="text-muted-foreground flex h-screen items-center justify-center text-sm">
                Loading exam...
            </div>
        )
    }

    const opensAt = new Date((exam.timeslots?.find((slot) => slot.isRegistered) ?? exam.timeslots?.[0])?.startsAt ?? new Date(0).toISOString()).getTime()
    const closesAt = opensAt + exam.durationMinutes * 60 * 1000
    const isBeforeOpen = now < opensAt
    const isAfterClose = now > closesAt
    const isWithinWindow = !isBeforeOpen && !isAfterClose

    return (
        <div className="bg-background flex min-h-dvh items-center justify-center">
            <Stack gap={8} className="w-full max-w-md px-6">
                <Stack gap={3}>
                    <Group gap={2} align="center">
                        <FileText className="size-5 text-primary" />
                        <Text as="span" size="sm" color="muted">
                            {exam.description}
                        </Text>
                    </Group>
                    <Heading level={1} size="xl" className="!font-serif">
                        {exam.title}
                    </Heading>
                </Stack>

                <Stack gap={3} className="rounded-xl border border-border bg-card p-5">
                    {liveAttempt ? (
                        <Group
                            gap={2}
                            align="center"
                            className="rounded-md border border-success/30 bg-success/10 px-2 py-1"
                        >
                            <span className="inline-block size-2 rounded-full bg-success" />
                            <Text as="span" size="xs" className="text-success">
                                Attempt in progress
                            </Text>
                        </Group>
                    ) : null}
                    <Group gap={4}>
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Duration
                            </Text>
                            <Group gap={1} align="center">
                                <Clock className="size-4 text-muted-foreground" />
                                <Text as="span" size="sm" weight="medium">
                                    {exam.durationMinutes} minutes
                                </Text>
                            </Group>
                        </Stack>
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Questions
                            </Text>
                            <Text as="span" size="sm" weight="medium">
                                {questions.length} questions
                            </Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Points
                            </Text>
                            <Text as="span" size="sm" weight="medium">
                                {totalPoints} pts
                            </Text>
                        </Stack>
                    </Group>
                    <Stack gap={1}>
                        <Text as="span" size="xs" color="muted">
                            Opens at
                        </Text>
                        <Group gap={1} align="center">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            <Text as="span" size="sm" weight="medium">
                                {formatStartsAt((exam.timeslots?.find((slot) => slot.isRegistered) ?? exam.timeslots?.[0])?.startsAt ?? new Date(0).toISOString())}
                            </Text>
                        </Group>
                    </Stack>
                    <Stack gap={1}>
                        <Text as="span" size="xs" color="muted">
                            Closes at
                        </Text>
                        <Group gap={1} align="center">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            <Text as="span" size="sm" weight="medium">
                                {formatStartsAt(new Date(closesAt).toISOString())}
                            </Text>
                        </Group>
                    </Stack>
                    <Group gap={4}>
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Max attempts
                            </Text>
                            <Text as="span" size="sm" weight="medium">
                                {exam.maxAttempts}
                            </Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Used
                            </Text>
                            <Text as="span" size="sm" weight="medium">
                                {usedAttempts}
                            </Text>
                        </Stack>
                    </Group>
                </Stack>

                <Stack gap={3}>
                    <Text as="p" size="sm" color="muted">
                        Once you begin, the timer starts and cannot be paused. Make sure you are
                        ready before starting.
                    </Text>
                    {isBeforeOpen ? (
                        <Text
                            as="p"
                            size="sm"
                            className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-warning"
                        >
                            This exam is not open yet.
                        </Text>
                    ) : null}
                    {isAfterClose && !liveAttempt ? (
                        <Text
                            as="p"
                            size="sm"
                            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
                        >
                            This exam is closed.
                        </Text>
                    ) : null}
                    {isAfterClose && liveAttempt ? (
                        <Text
                            as="p"
                            size="sm"
                            className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-warning"
                        >
                            This exam is closed for new attempts, but you can continue your active attempt.
                        </Text>
                    ) : null}
                    {maxAttemptsReached ? (
                        <Text
                            as="p"
                            size="sm"
                            className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-warning"
                        >
                            You have used all available attempts for this exam.
                        </Text>
                    ) : null}
                    {liveAttempt ? (
                        <Button
                            onClick={handleContinue}
                            disabled={isAfterClose}
                            className="w-full gap-2"
                        >
                            <Play className="size-4" />
                            Continue Attempt
                        </Button>
                    ) : (
                        <Button
                            onClick={() => void handleStart()}
                            disabled={
                                startAttempt.isPending || maxAttemptsReached || !isWithinWindow
                            }
                            className="w-full gap-2"
                        >
                            <Play className="size-4" />
                            {startAttempt.isPending ? "Starting..." : "Begin Exam"}
                        </Button>
                    )}
                </Stack>
            </Stack>
        </div>
    )
}
