import { Stack, Group, Text, Heading } from "@/components/common"
import { useGetExams } from "../api/get-exams"
import { useAuth } from "@/features/auth/lib/use-auth"
import { FileText } from "lucide-react"
import { ExamListItem, ExamListItemSkeleton } from "./exam-list-item"

export function ExamListPage() {
    const { data: exams, isLoading, isError } = useGetExams()
    const { userId: studentId } = useAuth()

    return (
        <div className="mx-auto max-w-2xl px-6 py-12">
            <Stack gap={8}>
                <Stack gap={1}>
                    <Group gap={2} align="center">
                        <FileText className="size-5 text-primary" />
                        <Heading level={1} size="lg">
                            Exams
                        </Heading>
                    </Group>
                    <Text as="p" size="sm" color="muted">
                        Select an exam to begin.
                    </Text>
                </Stack>

                {isLoading ? (
                    <Stack gap={3}>
                        <ExamListItemSkeleton />
                        <ExamListItemSkeleton />
                        <ExamListItemSkeleton />
                    </Stack>
                ) : null}

                {isError && (
                    <Text as="p" size="sm" color="destructive">
                        Failed to load exams.
                    </Text>
                )}

                {exams && (
                    <Stack gap={3}>
                        {exams.length === 0 && (
                            <Text as="p" size="sm" color="muted">
                                No exams available.
                            </Text>
                        )}
                        {exams.map((exam) => (
                            <ExamListItem key={exam.id} exam={exam} studentId={studentId} />
                        ))}
                    </Stack>
                )}
            </Stack>
        </div>
    )
}
