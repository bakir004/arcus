import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Panel } from "./panel"
import { Stack } from "./stack"
import { Text } from "./text"
import { Heading } from "./heading"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <Panel className={cn("px-5 py-8 text-center", className)}>
            <Stack gap={3} align="center">
                {Icon ? (
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-5" />
                    </div>
                ) : null}
                <Stack gap={1} align="center">
                    <Heading level={3} size="md">
                        {title}
                    </Heading>
                    {description ? <Text tone="muted">{description}</Text> : null}
                </Stack>
                {action ? <div className="pt-1">{action}</div> : null}
            </Stack>
        </Panel>
    )
}
