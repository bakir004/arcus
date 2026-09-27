import * as React from "react"
import { Badge, BadgePart } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Box, Group, Text, Heading, ThemeToggle } from "@/components/common"
import {
    BellRing,
    Clock,
    Send,
    Wifi,
    WifiOff,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ExamNavbarProps {
    courseCode?: string
    courseName: string
    examName: string
    studentName: string
    studentCode: string
    initialSeconds: number
    pendingSyncCount: number
    isSyncing: boolean
    lastSyncedAt: number | null
    syncError: boolean
    announcementCount: number
    isSubmitting?: boolean
    isAutoSubmitting?: boolean
    onOpenAnnouncements: () => void
    onSubmit: () => void
    onTimeUp?: () => void
}

function formatLastSynced(lastSyncedAt: number | null): string {
    if (!lastSyncedAt) return "Up to date — no pending changes"
    const seconds = Math.max(0, Math.floor((Date.now() - lastSyncedAt) / 1000))
    if (seconds < 5) return "Synced just now"
    if (seconds < 60) return `Synced ${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Synced ${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `Synced ${hours}h ago`
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const LOW_TIME_THRESHOLD_SECONDS = 300

export function ExamNavbar({
    courseCode,
    examName,
    studentName,
    studentCode,
    initialSeconds,
    pendingSyncCount,
    isSyncing,
    lastSyncedAt,
    syncError,
    announcementCount,
    onOpenAnnouncements,
    onSubmit,
    isSubmitting = false,
    isAutoSubmitting = false,
    onTimeUp,
}: ExamNavbarProps) {
    const isOnline = useOnlineStatus()
    const navigate = useNavigate()
    const timerGroupRef = React.useRef<HTMLDivElement>(null)
    const hasTriggeredTimeUpRef = React.useRef(false)
    const onTimeUpRef = React.useRef(onTimeUp)
    const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds)

    React.useEffect(() => {
        onTimeUpRef.current = onTimeUp
    }, [onTimeUp])

    React.useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                const next = Math.max(0, prev - 1)
                if (next === 0 && !hasTriggeredTimeUpRef.current) {
                    hasTriggeredTimeUpRef.current = true
                    onTimeUpRef.current?.()
                }
                return next
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    React.useEffect(() => {
        if (timerGroupRef.current) {
            const isLow = secondsLeft <= LOW_TIME_THRESHOLD_SECONDS
            timerGroupRef.current.classList.toggle("border-destructive", isLow)
            timerGroupRef.current.classList.toggle("text-destructive", isLow)
            timerGroupRef.current.classList.toggle("border-border", !isLow)
            timerGroupRef.current.classList.toggle("text-foreground", !isLow)
        }
    }, [secondsLeft])

    const isInitiallyLow = initialSeconds <= LOW_TIME_THRESHOLD_SECONDS

    return (
        <Box as="header" className="bg-sidebar sticky top-0 z-50 w-full border-b">
            <Group justify="between" align="center" className="h-16 px-4">
                <Group gap={4} align="center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => courseCode && navigate({ to: "/courses/$code/exams", params: { code: courseCode } })}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Group align="center" gap={3}>
                        <Heading level={1} size="md" className="font-serif leading-none">
                            {examName}
                        </Heading>
                    </Group>

                    <Badge variant="outline">
                        <BadgePart variant="muted" className="font-medium">
                            {studentName}
                        </BadgePart>
                        <BadgePart variant="secondary" className="font-mono">
                            {studentCode}
                        </BadgePart>
                    </Badge>
                </Group>

                <Group gap={4} align="center">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Group
                                    gap={1}
                                    align="center"
                                    className={`cursor-default ${
                                        syncError
                                            ? "text-destructive"
                                            : pendingSyncCount > 0 || isSyncing
                                              ? "text-warning"
                                              : "text-success"
                                    }`}
                                >
                                    {syncError ? (
                                        <AlertCircle className="size-4" />
                                    ) : isSyncing ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="size-4" />
                                    )}
                                    <Text
                                        as="span"
                                        size="xs"
                                        weight="medium"
                                        className={
                                            syncError
                                                ? "text-destructive"
                                                : pendingSyncCount > 0 || isSyncing
                                                  ? "text-warning"
                                                  : "text-success"
                                        }
                                    >
                                        {syncError
                                            ? "Sync error"
                                            : isSyncing
                                              ? "Syncing..."
                                              : pendingSyncCount > 0
                                                ? `${pendingSyncCount} pending`
                                                : "Synced"}
                                    </Text>
                                </Group>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {syncError
                                    ? "Could not sync answers. We will retry automatically."
                                    : pendingSyncCount > 0 || isSyncing
                                      ? `${pendingSyncCount} answer(s) waiting to sync.`
                                      : formatLastSynced(lastSyncedAt)}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Group
                                    gap={1}
                                    align="center"
                                    className={`cursor-default ${isOnline ? "text-success" : "text-destructive"}`}
                                >
                                    {isOnline ? (
                                        <Wifi className="size-4" />
                                    ) : (
                                        <WifiOff className="size-4" />
                                    )}
                                    <Text
                                        as="span"
                                        size="xs"
                                        weight="medium"
                                        className={isOnline ? "text-success" : "text-destructive"}
                                    >
                                        {isOnline ? "Online" : "Offline"}
                                    </Text>
                                </Group>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {isOnline
                                    ? "Your answers are being saved in real time."
                                    : "You are offline. Don't worry — your progress is saved locally and will sync when you reconnect."}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <ThemeToggle />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenAnnouncements}
                        className="gap-2"
                    >
                        <BellRing className="size-4" />
                        Announcements
                        <Box className="relative inline-flex h-5 w-5 items-center justify-center">
                            <Text
                                as="span"
                                size="xs"
                                weight="bold"
                                className="relative rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground"
                            >
                                {announcementCount}
                            </Text>
                        </Box>
                    </Button>

                    <Group
                        ref={timerGroupRef}
                        gap={2}
                        align="center"
                        className={`rounded-lg border px-2.5 py-0.75 font-mono tabular-nums ${
                            isInitiallyLow
                                ? "border-destructive text-destructive"
                                : "border-border text-foreground"
                        }`}
                    >
                        <Clock className="size-4 shrink-0" />
                        <Text
                            as="span"
                            size="base"
                            weight="bold"
                            className={`font-mono tracking-wide tabular-nums ${
                                isInitiallyLow ? "text-destructive" : "text-foreground"
                            }`}
                        >
                            {isAutoSubmitting ? "Auto-submitting..." : formatTime(secondsLeft)}
                        </Text>
                    </Group>

                    <Button onClick={onSubmit} className="gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </Button>
                </Group>
            </Group>
        </Box>
    )
}
