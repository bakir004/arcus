import { useAuth } from "@/features/auth/lib/use-auth"
import {
    ExamAttemptStatus,
    type Exam,
    type ExamAnnouncement,
    type ExamQuestion,
} from "@/features/exams/types"
import { Navigate } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { useGetAttempt } from "../api/get-attempt"
import { useGetExam } from "../api/get-exam"
import { useGetExamAnnouncements } from "../api/get-exam-announcements"
import { useGetExamQuestions } from "../api/get-exam-questions"
import { ExamNavbar } from "../components/exam-navbar"
import { ExamPortalShell } from "../components/exam-portal-shell"
import { getCachedExam, getCachedExamQuestions } from "../lib/offline-exam-store"

interface ExamPortalPageProps {
    examId: string
    attemptId: string
}

export function ExamPortalPage({ examId, attemptId }: ExamPortalPageProps) {
    const { userId, isLoading: authLoading } = useAuth()
    const { data: exam, isLoading: examLoading } = useGetExam(examId)

    const [cachedExam, setCachedExam] = React.useState<Exam | null>(null)
    const [cachedQuestions, setCachedQuestions] = React.useState<ExamQuestion[]>([])
    const [cachedAnnouncements, setCachedAnnouncements] = React.useState<ExamAnnouncement[]>([])
    const [cacheLoaded, setCacheLoaded] = React.useState(false)

    const resolvedExam = exam ?? cachedExam
    const courseId = resolvedExam?.courseId
    // The public route may contain an exam slug, while nested API routes require the UUID.
    const resolvedExamId = resolvedExam?.id ?? ""
    const { data: questions = [], isLoading: questionsLoading } = useGetExamQuestions(
        courseId,
        resolvedExamId,
    )
    const { data: announcements = [] } = useGetExamAnnouncements(courseId, resolvedExamId)
    const {
        data: attempt,
        isLoading: attemptLoading,
        isError: attemptError,
    } = useGetAttempt(courseId, resolvedExamId, attemptId)

    const [resolvedAttemptId] = React.useState(attemptId)

    React.useEffect(() => {
        void (async () => {
            const [examFromCache, questionsFromCache] = await Promise.all([
                getCachedExam(examId),
                getCachedExamQuestions(examId),
            ])

            if (examFromCache) setCachedExam(examFromCache)
            if (questionsFromCache.length > 0) setCachedQuestions(questionsFromCache)

            if (typeof window !== "undefined") {
                try {
                    const raw = localStorage.getItem(`arcus:announcements:${examId}`)
                    if (raw) {
                        setCachedAnnouncements(JSON.parse(raw) as ExamAnnouncement[])
                    }
                } catch {
                    setCachedAnnouncements([])
                }
            }

            setCacheLoaded(true)
        })()
    }, [examId])

    const resolvedQuestions = questions.length > 0 ? questions : cachedQuestions
    const resolvedAnnouncements = announcements.length > 0 ? announcements : cachedAnnouncements

    const LoadingView = ({ message }: { message: string }) => (
        <div className="min-h-screen bg-background">
            {resolvedExam ? (
                <ExamNavbar
                    courseName={resolvedExam.description ?? "Exam"}
                    examName={resolvedExam.title}
                    studentName="Student"
                    studentCode="..."
                    initialSeconds={resolvedExam.durationMinutes * 60}
                    pendingSyncCount={0}
                    isSyncing={false}
                    lastSyncedAt={null}
                    syncError={false}
                    announcementCount={resolvedAnnouncements.length}
                    onOpenAnnouncements={() => {}}
                    onSubmit={() => {}}
                />
            ) : null}
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span>{message}</span>
                </div>
            </div>
        </div>
    )

    const isAttemptValid =
        !!userId &&
        !!attempt &&
        attempt.studentId === userId &&
        attempt.status === ExamAttemptStatus.InProgress

    const [attemptValidationGracePassed, setAttemptValidationGracePassed] = React.useState(false)
    const hasShownInvalidAttemptToastRef = React.useRef(false)

    React.useEffect(() => {
        const timer = setTimeout(() => setAttemptValidationGracePassed(true), 5000)
        return () => clearTimeout(timer)
    }, [])

    React.useEffect(() => {
        if (
            !hasShownInvalidAttemptToastRef.current &&
            attemptValidationGracePassed &&
            (attemptError || !isAttemptValid)
        ) {
            hasShownInvalidAttemptToastRef.current = true
            toast.error("This attempt is invalid or no longer active.")
        }
    }, [attemptError, attemptValidationGracePassed, isAttemptValid])

    if (
        authLoading ||
        !cacheLoaded ||
        ((examLoading || questionsLoading || attemptLoading) && !resolvedExam)
    ) {
        return <LoadingView message="Loading exam..." />
    }

    if (!resolvedExam) {
        return <div>Exam not found.</div>
    }

    if (!attemptValidationGracePassed && (attemptLoading || attemptError || !isAttemptValid)) {
        return <LoadingView message="Validating attempt..." />
    }

    if (attemptValidationGracePassed && (attemptError || !isAttemptValid)) {
        return <Navigate to="/" />
    }

    if (!cacheLoaded && resolvedQuestions.length === 0 && resolvedAnnouncements.length === 0) {
        return <LoadingView message="Loading portal..." />
    }

    if (!attempt) return <Navigate to="/" />

    return (
        <ExamPortalShell
            examId={resolvedExam.id}
            attemptId={resolvedAttemptId}
            exam={resolvedExam}
            attempt={attempt}
            questions={resolvedQuestions}
            announcements={resolvedAnnouncements}
        />
    )
}

export default ExamPortalPage
