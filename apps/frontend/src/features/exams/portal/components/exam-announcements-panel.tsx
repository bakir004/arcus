import { BellRing } from "lucide-react"
import { Box, Group, Stack, Text } from "@/components/common"
import { Button } from "@/components/ui/button"
import type { ExamAnnouncement } from "../../types"

interface ExamAnnouncementsPanelProps {
    announcements: ExamAnnouncement[]
    open: boolean
    onClose: () => void
}

export function ExamAnnouncementsPanel({
    announcements,
    open,
    onClose,
}: ExamAnnouncementsPanelProps) {
    if (!open) return null

    return (
        <Box className="fixed inset-0 z-40 flex justify-end pt-16" onClick={onClose}>
            <Box
                className="bg-card border-l scrollbar-thin border-border h-[calc(100vh-4rem)] w-full max-w-md p-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <Stack gap={4} className="h-full">
                    <Group justify="between" align="center">
                        <Group gap={2} align="center">
                            <BellRing className="size-4" />
                            <Text as="span" size="sm" weight="semibold">
                                Announcements
                            </Text>
                        </Group>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </Group>

                    <Box className="min-h-0 flex-1 overflow-y-auto">
                        {announcements.length === 0 ? (
                            <Text as="p" size="sm" color="muted">
                                No announcements yet.
                            </Text>
                        ) : (
                            <Stack gap={3}>
                                {announcements.map((a) => (
                                    <Box
                                        key={a.id}
                                        className="rounded-lg border border-border bg-background p-3"
                                    >
                                        <Text as="p" size="sm" weight="semibold">
                                            {a.title}
                                        </Text>
                                        <Text as="p" size="xs" color="muted" className="mt-1">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </Text>
                                        <Text as="p" size="sm" className="mt-2 whitespace-pre-wrap">
                                            {a.message}
                                        </Text>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Box>
        </Box>
    )
}
