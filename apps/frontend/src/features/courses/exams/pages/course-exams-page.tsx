import { Link, useNavigate } from "@tanstack/react-router"
import {
    CalendarDays,
    DoorOpen,
    FileClock,
    MessageSquare,
    Users,
    Monitor,
    PenLine,
    Mic,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Box, Group, Heading, Panel, Stack, Text } from "@/components/common"
import { useGetCourseMembership } from "@/features/courses/api/get-course-membership"
import { createDraftExamRequest } from "@/features/exams/list/api/create-exam"
import { getCourseExamsRequest } from "@/features/exams/list/api/get-exams"
import { apiClient } from "@/api/api-client"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ExamType } from "@/features/exams/types"
import * as React from "react"

function formatExamStart(value: string): string {
    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export function CourseExamsPage({ courseId, courseCode }: { courseId: string; courseCode: string }) {
    const navigate = useNavigate()
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
    const [selectedExamType, setSelectedExamType] = React.useState<ExamType>(ExamType.Online)
    const queryClient = useQueryClient()
    const { data: membership } = useGetCourseMembership(courseId)
    const canEditExams = membership?.permissions.includes("exam:update") ?? false
    const { data: dbExams = [], isLoading } = useQuery({
        queryKey: ["courses", courseId, "exams"],
        queryFn: () => getCourseExamsRequest(courseId),
    })
    const registration = useMutation({
        mutationFn: ({
            examId,
            timeslotId,
            cancel,
        }: {
            examId: string
            timeslotId?: string
            cancel?: boolean
        }) =>
            apiClient<void>(
                cancel
                    ? `/courses/${courseId}/exams/${examId}/timeslots/registration/me`
                    : `/courses/${courseId}/exams/${examId}/timeslots/${timeslotId}/registration`,
                { method: cancel ? "DELETE" : "POST" },
            ),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ["courses", courseId, "exams"] })
            toast.success(
                variables.cancel
                    ? "Registration cancelled."
                    : "Successfully registered for the exam.",
            )
        },
    })
    const createExam = useMutation({
        mutationFn: (type: ExamType) => createDraftExamRequest(courseId, type),
        onSuccess: async (exam) => {
            await queryClient.invalidateQueries({ queryKey: ["courses", courseId, "exams"] })
            await navigate({
                to: "/courses/$code/exams/$examId/edit",
                params: { code: courseCode, examId: exam.id },
            })
        },
    })

    return (
        <Stack gap={4}>
            <Group justify="between" align="start" gap={4}>
                <Box>
                    <Heading level={2} size="lg">
                        Exams
                    </Heading>
                    <Text tone="muted">Grouped exam terms and their available timeslots.</Text>
                </Box>
                <Group gap={2}>
                    {canEditExams ? (
                        <Button
                            type="button"
                            disabled={createExam.isPending}
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            {createExam.isPending ? "Creating…" : "Create exam"}
                        </Button>
                    ) : null}
                    <Badge variant="outline">{dbExams.length} exams</Badge>
                </Group>
            </Group>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Choose exam type</DialogTitle>
                        <DialogDescription>
                            Select how students will take the exam.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        {[
                            [
                                ExamType.Written,
                                PenLine,
                                "Written",
                                "Students take a written exam on faculty premises.",
                            ],
                            [
                                ExamType.Online,
                                Monitor,
                                "Online",
                                "Students take an online exam via their personal or school computer on faculty premises.",
                            ],
                            [
                                ExamType.Verbal,
                                Mic,
                                "Verbal",
                                "Students converse with the professor.",
                            ],
                        ].map(([type, Icon, label, description]) => (
                            <label
                                key={type as string}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedExamType === type ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                            >
                                <input
                                    type="radio"
                                    name="exam-type"
                                    value={type as string}
                                    checked={selectedExamType === type}
                                    onChange={() => setSelectedExamType(type as ExamType)}
                                    className="accent-primary"
                                />
                                <Icon className="size-5" />
                                <span className="flex-1">
                                    <span className="block font-medium">{label as string}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {description as string}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={createExam.isPending}
                            onClick={() => {
                                setCreateDialogOpen(false)
                                createExam.mutate(selectedExamType)
                            }}
                        >
                            {createExam.isPending ? "Creating…" : "Confirm"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Stack gap={4}>
                {isLoading ? (
                    <Panel className="px-5 py-4">
                        <Text tone="muted">Loading database exams…</Text>
                    </Panel>
                ) : null}

                {dbExams.map((exam) => (
                    <Panel key={exam.id} className="p-0">
                        <Stack gap={0}>
                            <Link
                                to={
                                    canEditExams
                                        ? "/courses/$code/exams/$examId/edit"
                                        : "/exams/$examId"
                                }
                                params={
                                    canEditExams
                                        ? { code: courseCode, examId: exam.id }
                                        : { examId: exam.id }
                                }
                                className={`block border-b border-border px-5 py-4 transition-colors last:border-b-0 ${canEditExams || exam.type === "online" ? "hover:bg-accent" : "cursor-default"}`}
                                onClick={
                                    canEditExams || exam.type === "online"
                                        ? undefined
                                        : (event) => event.preventDefault()
                                }
                                tabIndex={canEditExams || exam.type === "online" ? undefined : -1}
                            >
                                <Group justify="between" gap={4}>
                                    <Group gap={3} className="min-w-0">
                                        <Box className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                                            <CalendarDays className="size-5" />
                                        </Box>
                                        <Box className="min-w-0">
                                            <Group gap={2} align="center" className="flex-wrap">
                                                <Heading level={3} size="md">
                                                    {exam.title}
                                                </Heading>
                                                <Badge variant="secondary">
                                                    {(exam.type ?? "written")
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        (exam.type ?? "written").slice(1)}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {exam.durationMinutes} min
                                                </Badge>
                                                <Badge variant="ghost">
                                                    {exam.maxAttempts} max attempts
                                                </Badge>
                                            </Group>
                                            {exam.description ? (
                                                <Text tone="muted" size="sm" className="mt-1">
                                                    {exam.description}
                                                </Text>
                                            ) : null}
                                        </Box>
                                    </Group>
                                </Group>
                            </Link>
                            {exam.timeslots?.length ? (
                                <div className="overflow-x-auto">
                                    {(() => {
                                        const hasComments = exam.timeslots.some(
                                            (slot) => slot.comment,
                                        )
                                        return (
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="text-xs text-muted-foreground">
                                                        <th className="p-3">#</th>
                                                        <th className="p-3">
                                                            <Group gap={1}>
                                                                <CalendarDays className="size-4" />
                                                                Date / time
                                                            </Group>
                                                        </th>
                                                        <th className="p-3">
                                                            <Group gap={1}>
                                                                <DoorOpen className="size-4" />
                                                                Room
                                                            </Group>
                                                        </th>
                                                        <th className="p-3">
                                                            <Group gap={1}>
                                                                <FileClock className="size-4" />
                                                                Register by
                                                            </Group>
                                                        </th>
                                                        <th className="p-3">
                                                            <Group gap={1}>
                                                                <Users className="size-4" />
                                                                Signed up
                                                            </Group>
                                                        </th>
                                                        {hasComments ? (
                                                            <th className="p-2">
                                                                <Group gap={1}>
                                                                    <MessageSquare className="size-4" />
                                                                    Comment
                                                                </Group>
                                                            </th>
                                                        ) : null}
                                                        <th className="p-2" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {exam.timeslots.map((slot, index) => {
                                                        const full =
                                                            slot.availableSeats === 0 &&
                                                            !slot.isRegistered
                                                        return (
                                                            <tr key={slot.id} className="border-t">
                                                                <td className="p-3">{index + 1}</td>
                                                                <td className="p-3">
                                                                    {formatExamStart(slot.startsAt)}
                                                                </td>
                                                                <td className="p-3">
                                                                    {slot.location}
                                                                </td>
                                                                <td className="p-3">
                                                                    {slot.registrationDueAt
                                                                        ? new Date(
                                                                              slot.registrationDueAt,
                                                                          ).toLocaleDateString()
                                                                        : "—"}
                                                                </td>
                                                                <td className="p-3">
                                                                    {slot.registrationCount}/
                                                                    {slot.capacity}
                                                                </td>
                                                                {hasComments ? (
                                                                    <td className="p-2 text-muted-foreground">
                                                                        {slot.comment || "—"}
                                                                    </td>
                                                                ) : null}
                                                                <td className="p-3 text-right">
                                                                    {canEditExams ? null : <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant={
                                                                            slot.isRegistered
                                                                                ? "outline"
                                                                                : "default"
                                                                        }
                                                                        disabled={
                                                                            registration.isPending ||
                                                                            full ||
                                                                            (exam.timeslots?.some(
                                                                                (item) =>
                                                                                    item.isRegistered,
                                                                            ) &&
                                                                                !slot.isRegistered)
                                                                        }
                                                                        onClick={() =>
                                                                            registration.mutate({
                                                                                examId: exam.id,
                                                                                timeslotId: slot.id,
                                                                                cancel: slot.isRegistered,
                                                                            })
                                                                        }
                                                                    >
                                                                        {slot.isRegistered
                                                                            ? "Unregister"
                                                                            : full
                                                                              ? "Full"
                                                                              : "Register"}
                                                                    </Button>}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        )
                                    })()}
                                </div>
                            ) : null}
                        </Stack>
                    </Panel>
                ))}
            </Stack>
        </Stack>
    )
}
