import { Link } from "@tanstack/react-router"
import { Group, Heading, Stack, Text } from "@/components/common"
import { useGetExamAttempts } from "../api/get-exam-attempts"
import { CalendarClock, Clock } from "lucide-react"
import { ExamAttemptStatus } from "@/features/exams/types"
import type { Exam, ExamAttempt, ExamTimeslot } from "@/features/exams/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/api/api-client"
import * as React from "react"

const dateTime = (value: string) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
const date = (value: string) => new Date(value).toLocaleDateString([], { dateStyle: "medium" })

function getAttemptLabel(attempt: ExamAttempt | undefined): string {
    if (!attempt) return "No attempt yet"
    if (attempt.status === ExamAttemptStatus.InProgress) return "Attempt live"
    if (attempt.status === ExamAttemptStatus.Submitted) return "Attempt submitted"
    return attempt.score == null ? "Attempt graded" : `Graded: ${attempt.score}`
}

export function ExamListItem({ exam, studentId }: { exam: Exam; studentId: string }) {
    const { data: attempts } = useGetExamAttempts(exam.courseId, exam.id, studentId)
    const [slots, setSlots] = React.useState(exam.timeslots ?? [])
    const [busy, setBusy] = React.useState<string | null>(null)
    const studentAttempts = (attempts ?? []).filter((a) => a.studentId === studentId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    const latestAttempt = studentAttempts[0]

    async function toggle(slot: ExamTimeslot) {
        setBusy(slot.id)
        try {
            if (slot.isRegistered) {
                await apiClient(`/courses/${exam.courseId}/exams/${exam.id}/timeslots/registration/me`, { method: "DELETE" })
            } else {
                await apiClient(`/courses/${exam.courseId}/exams/${exam.id}/timeslots/${slot.id}/registration`, { method: "POST" })
            }
            const updated = await apiClient<ExamTimeslot[]>(`/courses/${exam.courseId}/exams/${exam.id}/timeslots`)
            setSlots(updated)
        } finally { setBusy(null) }
    }

    return <div className="rounded-xl border border-border bg-card p-5">
        <Link to="/exams/$examId/start" params={{ examId: exam.slug }} className="block hover:text-primary">
            <Group justify="between" align="start"><Stack gap={2}><Heading level={3} size="sm">{exam.title}</Heading>{exam.description && <Text as="p" size="sm" color="muted">{exam.description}</Text>}<Group gap={3}><Group gap={1}><Clock className="size-3.5" /><Text size="xs" color="muted">{exam.durationMinutes} min</Text></Group><Text size="xs" color="muted">{getAttemptLabel(latestAttempt)} · Attempts {studentAttempts.length}/{exam.maxAttempts}</Text></Group></Stack></Group>
        </Link>
        <div className="mt-5 overflow-x-auto border-t pt-4"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="p-2">Date / time</th><th className="p-2">Room</th><th className="p-2">Register by</th><th className="p-2">Signed up</th><th className="p-2">Comment</th><th className="p-2" /></tr></thead><tbody>{slots.map((slot) => { const full = slot.availableSeats <= 0 && !slot.isRegistered; return <tr key={slot.id} className="border-t"><td className="p-2"><Group gap={1}><CalendarClock className="size-3.5" />{dateTime(slot.startsAt)}</Group></td><td className="p-2">{slot.location}</td><td className="p-2">{slot.registrationDueAt ? date(slot.registrationDueAt) : "—"}</td><td className="p-2">{slot.registrationCount}/{slot.capacity}</td><td className="p-2 text-muted-foreground">{slot.comment || "—"}</td><td className="p-2 text-right"><Button size="sm" variant={slot.isRegistered ? "outline" : "default"} disabled={full || busy === slot.id} onClick={() => void toggle(slot)}>{slot.isRegistered ? "Unregister" : full ? "Full" : "Register"}</Button></td></tr>})}</tbody></table>{!slots.length && <Text size="sm" color="muted">No timeslots available.</Text>}</div>
    </div>
}

export function ExamListItemSkeleton() { return <div className="w-full rounded-xl border border-border bg-card p-5"><Stack gap={3}><Skeleton className="h-5 w-2/5" /><Skeleton className="h-4 w-4/5" /><Group gap={3}><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-24" /></Group></Stack></div> }
