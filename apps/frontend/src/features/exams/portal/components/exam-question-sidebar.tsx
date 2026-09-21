import * as React from "react"
import {
    ChevronsLeft,
    ChevronsRight,
    BookText,
    PenLine,
    Code2,
    CheckCheck,
    Flag,
    Dot,
} from "lucide-react"
import { QuestionOptionType, type QuestionOptionType as QuestionType } from "@/features/exams/types"
import { Box, Group, Stack, Text, Heading } from "@/components/common"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ExamQuestion, QuestionStatus } from "@/features/exams/portal/types/question-sidebar-types"

interface ExamQuestionSidebarProps {
    questions: ExamQuestion[]
    activePosition: number | null
    onSelect: (position: number) => void
}

function promptToTitle(prompt: string): string {
    return prompt
        .split("\n")[0]
        .replace(/[*_`#>]/g, "")
        .trim()
        .slice(0, 60)
}

const typeLabel: Record<QuestionType, string> = {
    [QuestionOptionType.MultipleChoice]: "Multiple Choice",
    [QuestionOptionType.Essay]: "Essay",
    [QuestionOptionType.Coding]: "Coding",
}

const typeIcon: Record<QuestionType, React.ReactNode> = {
    [QuestionOptionType.MultipleChoice]: <BookText className="size-3.5" />,
    [QuestionOptionType.Essay]: <PenLine className="size-3.5" />,
    [QuestionOptionType.Coding]: <Code2 className="size-3.5" />,
}

const statusStyles: Record<QuestionStatus, string> = {
    unanswered: "border-l-2 border-l-border",
    answered: "border-l-2 border-l-success",
    flagged: "border-l-2 border-l-warning",
}

const statusDot: Record<QuestionStatus, string> = {
    unanswered: "bg-border",
    answered: "bg-success",
    flagged: "bg-warning",
}

export function ExamQuestionSidebar({
    questions,
    activePosition,
    onSelect,
}: ExamQuestionSidebarProps) {
    const [collapsed, setCollapsed] = React.useState(false)

    const answered = questions.filter((q) => q.status === "answered").length
    const flagged = questions.filter((q) => q.status === "flagged").length

    return (
        <Box
            as="aside"
            className={cn(
                "bg-card relative flex h-full flex-col border-r transition-[width] duration-300 ease-in-out",
                collapsed ? "w-14" : "w-72",
            )}
        >
            {/* Header */}
            <Box className="shrink-0 border-b">
                {collapsed ? (
                    <Group justify="center" className="py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(false)}
                            className="text-muted-foreground hover:text-foreground size-8"
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </Group>
                ) : (
                    <Box className="px-4 py-3">
                        <Group justify="between" align="start">
                            <Stack gap={2}>
                                <Heading level={3} size="sm">
                                    Questions
                                </Heading>
                                <Group gap={3}>
                                    <Group gap={1} align="center">
                                        <CheckCheck className="text-success size-3.5" />
                                        <Text as="span" size="xs" color="muted">
                                            {answered} answered
                                        </Text>
                                    </Group>
                                    <Group gap={1} align="center">
                                        <Flag className="text-warning size-3.5" />
                                        <Text as="span" size="xs" color="muted">
                                            {flagged} flagged
                                        </Text>
                                    </Group>
                                </Group>
                            </Stack>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(true)}
                                className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                        </Group>
                    </Box>
                )}
            </Box>

            {/* Question list */}
            <Box className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                {collapsed ? (
                    // Collapsed: number pills only
                    <Stack className="items-center gap-3 py-3">
                        {questions.map((q) => (
                            <Button
                                key={q.id}
                                onClick={() => onSelect(q.number)}
                                variant={activePosition === q.number ? "default" : "outline"}
                                className={"size-8"}
                            >
                                {q.number}
                            </Button>
                        ))}
                    </Stack>
                ) : (
                    // Expanded: full question rows
                    <Stack>
                        {questions.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => onSelect(q.number)}
                                className={cn(
                                    "hover:bg-accent w-full cursor-pointer px-4 py-3 text-left transition-colors",
                                    statusStyles[q.status],
                                    activePosition === q.number && "bg-accent",
                                )}
                            >
                                <Group gap={3} align="start">
                                    {/* Number square */}
                                    <Text
                                        as="span"
                                        size="xs"
                                        weight="semibold"
                                        className={cn(
                                            "flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                                            activePosition === q.number
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-muted-foreground",
                                        )}
                                    >
                                        {q.number}
                                    </Text>

                                    {/* Content */}
                                    <Stack gap={1} className="min-w-0 flex-1">
                                        <Text as="span" size="sm" weight="medium" truncate>
                                            {promptToTitle(q.title)}
                                        </Text>
                                        <Group gap={1} align="center">
                                            <Group
                                                gap={1}
                                                align="center"
                                                className="text-muted-foreground"
                                            >
                                                {typeIcon[q.type]}
                                                <Text as="span" size="xs" color="muted">
                                                    {typeLabel[q.type]}
                                                </Text>
                                            </Group>
                                            <Dot className="size-2" />
                                            <Text as="span" size="xs" color="muted">
                                                {q.points} pts
                                            </Text>
                                        </Group>
                                    </Stack>

                                    {/* Status dot */}
                                    <Box
                                        className={cn(
                                            "mt-1.5 size-2 shrink-0 rounded-full",
                                            statusDot[q.status],
                                        )}
                                    />
                                </Group>
                            </button>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    )
}
