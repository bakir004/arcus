import * as React from "react"
import { Flag } from "lucide-react"
import { Group, Heading, Text } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ExamQuestionHeader({
    number,
    points,
    title,
    typeLabel,
    flagged,
    onFlag,
    flagVariant = "outline",
    children,
}: {
    number: number
    points: number
    title?: React.ReactNode
    prompt: string
    typeLabel: string
    flagged: boolean
    onFlag: () => void
    flagVariant?: "outline" | "ghost"
    children?: React.ReactNode
}) {
    return (
        <Group justify="between" align="center" className="border-b px-6 py-4">
            <Group gap={3} align="center">
                <Heading level={2} size="md">
                    {title ?? `Question ${number}`}
                </Heading>
                <Badge variant="secondary">{typeLabel}</Badge>
                {children}
                <Text as="span" size="sm" color="muted">
                    {points} points
                </Text>
            </Group>

            <Button
                variant={flagged ? "default" : flagVariant}
                size="sm"
                onClick={onFlag}
                className={cn(
                    "gap-2",
                    flagged &&
                        "bg-warning text-warning-foreground hover:bg-warning/90 border-warning",
                )}
            >
                <Flag className="size-3.5" />
                {flagged ? "Flagged" : "Flag for Review"}
            </Button>
        </Group>
    )
}
