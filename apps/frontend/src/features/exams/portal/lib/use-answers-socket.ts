import * as React from "react"
import type { QuestionAnswerPayload } from "@/features/exams/types"
import { bulkSaveAnswersRequest, type BulkAnswerItem } from "../api/bulk-save-answers"

interface UseAnswersSyncParams {
    courseId: string
    examId: string
    attemptId: string
    userId: string
}

interface SaveAnswerInput {
    examItemId: string
    answer: QuestionAnswerPayload
}

/**
 * Queues answer changes locally and flushes them to the API every ten seconds.
 * The IndexedDB attempt snapshot remains the offline source of truth; this hook
 * only handles synchronizing pending answers when the API is reachable.
 */
export function useAnswersSocket({ courseId, examId, attemptId, userId }: UseAnswersSyncParams) {
    const pendingRef = React.useRef<Map<string, QuestionAnswerPayload>>(new Map())
    const [isConnected, setIsConnected] = React.useState(true)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [lastSyncedAt, setLastSyncedAt] = React.useState<number | null>(null)
    const [syncError, setSyncError] = React.useState(false)

    const flush = React.useCallback(async () => {
        if (!userId || pendingRef.current.size === 0 || !navigator.onLine) return

        const answers: BulkAnswerItem[] = Array.from(pendingRef.current, ([examItemId, answer]) => ({
            examItemId,
            answer,
        }))

        setIsSyncing(true)
        try {
            await bulkSaveAnswersRequest(courseId, examId, attemptId, answers)
            for (const answer of answers) {
                if (pendingRef.current.get(answer.examItemId) === answer.answer) {
                    pendingRef.current.delete(answer.examItemId)
                }
            }
            setIsConnected(true)
            setSyncError(false)
            setLastSyncedAt(Date.now())
        } catch {
            setIsConnected(false)
            setSyncError(true)
        } finally {
            setIsSyncing(false)
        }
    }, [attemptId, courseId, examId, userId])

    React.useEffect(() => {
        const interval = window.setInterval(() => void flush(), 10_000)
        const onOnline = () => void flush()
        const onOffline = () => {
            setIsConnected(false)
            setSyncError(true)
        }

        window.addEventListener("online", onOnline)
        window.addEventListener("offline", onOffline)
        return () => {
            window.clearInterval(interval)
            window.removeEventListener("online", onOnline)
            window.removeEventListener("offline", onOffline)
        }
    }, [flush])

    const saveAnswer = React.useCallback(({ examItemId, answer }: SaveAnswerInput) => {
        pendingRef.current.set(examItemId, answer)
        setSyncError(false)
    }, [])

    return { saveAnswer, isConnected, isSyncing, lastSyncedAt, syncError }
}
