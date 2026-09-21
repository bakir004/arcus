import * as React from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { Group, Stack, Text } from "@/components/common"
import { cn } from "@/lib/utils"
import type { TestCase } from "../../types/coding-types"
import { HighlightedCode } from "./highlighted-code"

export function TestCaseCard({ tc, language }: { tc: TestCase; language: string }) {
    const [open, setOpen] = React.useState(tc.status !== "passed")

    return (
        <Stack
            className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                tc.status === "passed" && "border-success/40 bg-success/5",
                tc.status === "failed" && "border-destructive/40 bg-destructive/5",
                !tc.status && "border-border",
            )}
        >
            <button
                onClick={() => setOpen((o) => !o)}
                className="hover:bg-card/50 flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition"
            >
                <Text as="span" size="sm" weight="medium">
                    {tc.label}
                </Text>
                {tc.status === "passed" && (
                    <Group gap={1} align="center" className="text-success">
                        <CheckCircle2 className="size-4" />
                        <Text as="span" size="xs" weight="medium" className="text-success">
                            Passed
                        </Text>
                    </Group>
                )}
                {tc.status === "failed" && (
                    <Group gap={1} align="center">
                        <XCircle className="text-destructive size-4" />
                        <Text as="span" size="xs" weight="medium" color="destructive">
                            Failed
                        </Text>
                    </Group>
                )}
            </button>

            {open && (
                <Stack gap={3} className="border-border border-t px-4 py-3">
                    {tc.input ? <Stack gap={1}>
                        <Text as="span" size="xs" color="muted">
                            Input:
                        </Text>
                        <Text as="div" size="xs" className="bg-background text-foreground rounded-md px-3 py-2 font-mono">
                            {tc.input}
                        </Text>
                    </Stack> : null}
                    <Stack gap={1}>
                        <Text as="span" size="xs" color="muted">
                            Expected:
                        </Text>
                        <Text as="div" size="xs" className="bg-background text-foreground rounded-md px-3 py-2 font-mono">
                            {tc.expected}
                        </Text>
                    </Stack>
                    {(tc.assembledCode || tc.serverCode || tc.testCode) && (
                        <Stack gap={2}>
                            <Text as="span" size="xs" color="muted">
                                Execution context:
                            </Text>
                            {tc.assembledCode && <HighlightedCode code={tc.assembledCode} language={language} />}
                            {tc.serverCode && (
                                <Stack gap={1}>
                                    <Text as="span" size="xs" color="muted">
                                        Student server code:
                                    </Text>
                                    <HighlightedCode code={tc.serverCode} language={language} />
                                </Stack>
                            )}
                            {tc.testCode && (
                                <Stack gap={1}>
                                    <Text as="span" size="xs" color="muted">
                                        Test code:
                                    </Text>
                                    <HighlightedCode code={tc.testCode} language={language} />
                                </Stack>
                            )}
                        </Stack>
                    )}
                    {tc.actual !== undefined && (
                        <Stack gap={1}>
                            <Text as="span" size="xs" color="muted">
                                Actual:
                            </Text>
                            <Text
                                as="div"
                                size="xs"
                                className={cn(
                                    "rounded-md px-3 py-2 font-mono",
                                    tc.status === "failed"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-background text-foreground",
                                )}
                            >
                                {tc.actual}
                            </Text>
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    )
}
