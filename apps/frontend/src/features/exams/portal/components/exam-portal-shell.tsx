import { Group, Stack } from "@/components/common"
import { useAuth } from "@/features/auth/lib/use-auth"
import { useGetCourse } from "@/features/courses/api/get-course"
import { ExamContext } from "@/features/exams/portal/exam-context"
import {
    CodingLanguage,
    QuestionOptionType,
    type CodingOptions,
    type Exam,
    type ExamAnnouncement,
    type ExamAttempt,
    type ExamQuestion,
    type QuestionAnswerPayload,
} from "@/features/exams/types"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Outlet, useNavigate } from "@tanstack/react-router"
import type { editor } from "monaco-editor"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { bulkSaveAnswersRequest } from "../api/bulk-save-answers"
import { useSubmitAttempt } from "../api/submit-attempt"
import { useAnswersSocket } from "../lib/use-answers-socket"
import { getAttemptState, saveAttemptState } from "../lib/offline-exam-store"
import type { TestCase } from "./coding/exam-coding"
import { ExamAnnouncementsPanel } from "./exam-announcements-panel"
import { ExamNavbar } from "./exam-navbar"
import { ExamQuestionSidebar } from "./exam-question-sidebar"
import type { ExamQuestion as SidebarQuestion } from "@/features/exams/portal/types/question-sidebar-types"
import { ExamSubmitDialog } from "./exam-submit-dialog"

interface ExamPortalShellProps {
    examId: string
    attemptId: string
    exam: Exam
    attempt: ExamAttempt
    questions: ExamQuestion[]
    announcements: ExamAnnouncement[]
}

const DEFAULT_CODING_LANGUAGE = CodingLanguage.JavaScript

export function ExamPortalShell({
    examId,
    attemptId,
    exam,
    attempt,
    questions,
    announcements,
}: ExamPortalShellProps) {
    const navigate = useNavigate()
    const isOnline = useOnlineStatus()
    const { user, userId: studentId } = useAuth()
    const { data: course } = useGetCourse(exam.courseId)

    const [activeQuestionPosition, setActiveQuestionPosition] = useState<number | null>(null)
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, string[]>>({})
    const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({})
    const [flagged, setFlagged] = useState<Record<string, boolean>>({})
    const [testResults, setTestResultsState] = useState<Record<string, TestCase[]>>({})
    const [showAnnouncements, setShowAnnouncements] = useState(false)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)

    const codeAnswers = useRef<Record<string, string>>({})
    const activeEditor = useRef<editor.IStandaloneCodeEditor | null>(null)

    const {
        saveAnswer: saveAnswerViaSocket,
        isConnected,
        isSyncing,
        lastSyncedAt,
        syncError,
    } = useAnswersSocket({
        courseId: exam.courseId,
        examId,
        attemptId,
        userId: studentId ?? "",
    })
    const submitAttempt = useSubmitAttempt(exam.courseId, examId, attemptId)

    useEffect(() => {
        void (async () => {
            const cached = await getAttemptState(examId)
            if (!cached || cached.attemptId !== attemptId) return

            const nextMcq: Record<string, string[]> = {}
            const nextEssay: Record<string, string> = {}
            const nextCode: Record<string, string> = {}

            for (const [qId, value] of Object.entries(cached.answersByQuestion)) {
                if (value.type === QuestionOptionType.MultipleChoice) {
                    nextMcq[qId] = value.selectedIndices.map(String)
                }
                if (value.type === QuestionOptionType.Essay) {
                    nextEssay[qId] = value.text
                }
                if (value.type === QuestionOptionType.Coding) {
                    nextCode[qId] = value.code
                }
            }

            for (const question of questions) {
                if (
                    question.options.type === QuestionOptionType.Coding &&
                    nextCode[question.id] === undefined
                ) {
                    nextCode[question.id] = (question.options as CodingOptions).initialCode ?? ""
                }
            }

            setMcqAnswers(nextMcq)
            setEssayAnswers(nextEssay)
            codeAnswers.current = nextCode
            setFlagged(cached.flagged)
            setTestResultsState(cached.testResults)
        })()
    }, [attemptId, examId, questions])

    const buildAnswer = (qId: string): QuestionAnswerPayload | null => {
        const question = questions.find((q) => q.id === qId)
        if (!question) return null

        if (question.options.type === QuestionOptionType.MultipleChoice) {
            const selectedIds = mcqAnswers[qId] ?? []
            return {
                type: QuestionOptionType.MultipleChoice,
                selectedIndices: selectedIds.map(Number),
            }
        }

        if (question.options.type === QuestionOptionType.Essay) {
            const text = essayAnswers[qId] ?? ""
            if (!text.trim()) return null
            return { type: QuestionOptionType.Essay, text }
        }

        if (question.options.type === QuestionOptionType.Coding) {
            const code =
                codeAnswers.current[qId] ?? (question.options as CodingOptions).initialCode ?? ""
            const language =
                (question.options as CodingOptions & { language?: CodingLanguage }).language ??
                DEFAULT_CODING_LANGUAGE
            return { type: QuestionOptionType.Coding, code, language }
        }

        return null
    }

    const saveAnswer = (questionId: string, overrideAnswer?: QuestionAnswerPayload) => {
        const answer = overrideAnswer ?? buildAnswer(questionId)
        if (!answer) return

        const answersByQuestion: Record<string, QuestionAnswerPayload> = {}
        for (const question of questions) {
            if (question.id === questionId) {
                answersByQuestion[question.id] = answer
                continue
            }
            const built = buildAnswer(question.id)
            if (built) answersByQuestion[question.id] = built
        }

        void saveAttemptState({
            examId,
            attemptId,
            studentId: studentId ?? "",
            answersByQuestion,
            pendingSyncByQuestion: { [questionId]: answer },
            flagged,
            testResults,
            updatedAt: Date.now(),
        })

        const question = questions.find((item) => item.id === questionId)
        if (question) saveAnswerViaSocket({ examItemId: question.examItemId, answer })
    }

    const setMcqAnswer = (qId: string, val: string[]) => {
        setMcqAnswers((prev) => ({ ...prev, [qId]: val }))
    }

    const setEssayAnswer = (qId: string, val: string) => {
        setEssayAnswers((prev) => ({ ...prev, [qId]: val }))
    }

    const toggleFlagged = (qId: string) => {
        setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }))
    }

    const setTestResults = (qId: string, results: TestCase[]) => {
        setTestResultsState((prev) => ({ ...prev, [qId]: results }))
    }

    const examContextValue = {
        exam,
        questions,
        attemptId,
        activeQuestionPosition,
        setActiveQuestionPosition,
        mcqAnswers,
        essayAnswers,
        flagged,
        testResults,
        codeAnswers,
        activeEditor,
        setMcqAnswer,
        setEssayAnswer,
        toggleFlagged,
        setTestResults,
        saveAnswer,
    }

    const effectiveSyncError = !isOnline || !isConnected || syncError
    const effectiveLastSyncedAt = !isOnline || !isConnected ? null : lastSyncedAt

    const attemptStartMs = new Date(attempt.startedAt).getTime()
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - attemptStartMs) / 1000))
    const initialSeconds = Math.max(0, exam.durationMinutes * 60 - elapsedSeconds)

    const sidebarQuestions: SidebarQuestion[] = questions.map((q, i) => {
        const isFlagged = flagged[q.id]
        const isAnswered =
            (q.options.type === QuestionOptionType.MultipleChoice &&
                (mcqAnswers[q.id]?.length ?? 0) > 0) ||
            (q.options.type === QuestionOptionType.Essay && !!essayAnswers[q.id]?.trim()) ||
            (q.options.type === QuestionOptionType.Coding &&
                !!(codeAnswers.current[q.id] ?? "").trim())
        return {
            id: q.id,
            number: q.position ?? i + 1,
            title: q.prompt,
            type: q.options.type,
            points: Number.parseFloat(q.points),
            status: isFlagged ? "flagged" : isAnswered ? "answered" : "unanswered",
        }
    })

    const onQuestionSelect = (position: number) => {
        const next = sidebarQuestions.find((q) => q.number === position)
        if (!next) return

        navigate({
            to: "/exams/$examId/attempts/$attemptId/questions/$questionPosition",
            params: {
                examId: exam.slug,
                attemptId,
                questionPosition: String(next.number),
            },
        })
    }

    const submitExam = async (auto = false) => {
        if (!isOnline || submitAttempt.isPending) return

        if (auto) setIsAutoSubmitting(true)

        try {
            // Flush Monaco and every locally known answer before submission closes the attempt.
            const activeQuestion = questions.find(
                (question) => question.position === activeQuestionPosition,
            )
            if (
                activeQuestion?.options.type === QuestionOptionType.Coding &&
                activeEditor.current
            ) {
                codeAnswers.current[activeQuestion.id] = activeEditor.current.getValue()
            }
            const answers = questions.flatMap((question) => {
                const answer = buildAnswer(question.id)
                return answer ? [{ examItemId: question.examItemId, answer }] : []
            })
            if (answers.length) {
                await bulkSaveAnswersRequest(exam.courseId, examId, attemptId, answers)
            }
            await submitAttempt.mutateAsync()
            toast.success(
                auto
                    ? "Time is up. Your exam was submitted automatically."
                    : "Exam submitted successfully.",
            )
            setShowSubmitDialog(false)
            if (course?.code) {
                navigate({ to: "/courses/$code/exams", params: { code: course.code } })
            } else {
                navigate({ to: "/" })
            }
        } catch (error) {
            setIsAutoSubmitting(false)
            const apiMessage =
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                Array.isArray(error.message)
                    ? error.message.join("\n")
                    : null
            toast.error(
                apiMessage ??
                    (auto
                        ? "Time is up, but auto-submit failed. Please submit manually now."
                        : "Failed to submit exam. Please try again."),
            )
        }
    }

    return (
        <ExamContext.Provider value={examContextValue}>
            <Stack className="bg-background h-screen">
                <ExamNavbar
                    courseCode={course?.code ?? undefined}
                    courseName={exam.description ?? ""}
                    examName={exam.title}
                    studentName={user?.name ?? "Student"}
                    studentCode={studentId ? studentId.slice(-4).toUpperCase() : "----"}
                    initialSeconds={initialSeconds}
                    pendingSyncCount={0}
                    isSyncing={isSyncing}
                    lastSyncedAt={effectiveLastSyncedAt}
                    syncError={effectiveSyncError}
                    announcementCount={announcements.length}
                    onOpenAnnouncements={() => setShowAnnouncements((open) => !open)}
                    onSubmit={() => setShowSubmitDialog(true)}
                    onTimeUp={() => void submitExam(true)}
                    isSubmitting={submitAttempt.isPending}
                    isAutoSubmitting={isAutoSubmitting}
                />
                <Group align="stretch" className="min-h-0 flex-1">
                    <ExamQuestionSidebar
                        questions={sidebarQuestions}
                        activePosition={activeQuestionPosition}
                        onSelect={onQuestionSelect}
                    />
                    <Stack className="min-w-0 flex-1">
                        <ExamAnnouncementsPanel
                            announcements={announcements}
                            open={showAnnouncements}
                            onClose={() => setShowAnnouncements(false)}
                        />
                        <Outlet />
                    </Stack>
                </Group>
            </Stack>

            <ExamSubmitDialog
                open={showSubmitDialog}
                onOpenChange={setShowSubmitDialog}
                questions={sidebarQuestions}
                isSubmitting={submitAttempt.isPending}
                canSubmit={isOnline}
                onSubmit={() => void submitExam(false)}
            />
        </ExamContext.Provider>
    )
}
