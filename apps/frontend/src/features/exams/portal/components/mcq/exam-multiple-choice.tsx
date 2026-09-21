import { cn } from "@/lib/utils"
import { Group, Stack, Text, Markdown } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { ExamQuestionHeader } from "@/features/exams/portal/components/exam-question-header"
import { useExamContext } from "@/features/exams/portal/exam-context"
import { QuestionOptionType, type ExamQuestion, type MultipleChoiceOptions } from "@/features/exams/types"
import type { MultipleChoiceOption } from "@/features/exams/portal/types/mcq-types"

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface ExamMultipleChoiceProps {
    number: number
    points: number
    question: string
    options: MultipleChoiceOption[]
    selectedIds: string[]
    allowMultiple?: boolean
    flagged: boolean
    onSelect: (ids: string[]) => void
    onFlag: () => void
}

function ExamMultipleChoice({
    number,
    points,
    question,
    options,
    selectedIds,
    allowMultiple = false,
    flagged,
    onSelect,
    onFlag,
}: ExamMultipleChoiceProps) {
    function toggle(id: string) {
        if (allowMultiple) {
            onSelect(
                selectedIds.includes(id)
                    ? selectedIds.filter((s) => s !== id)
                    : [...selectedIds, id],
            )
        } else {
            onSelect([id])
        }
    }

    return (
        <Stack className="h-full">
            <ExamQuestionHeader
                number={number}
                points={points}
                prompt={question}
                typeLabel="Multiple Choice"
                flagged={flagged}
                onFlag={onFlag}
            >
                {allowMultiple && (
                    <Badge variant="outline" className="gap-1 text-primary border-primary/40">
                        Select all that apply
                    </Badge>
                )}
            </ExamQuestionHeader>

            {/* Question body */}
            <Stack gap={6} className="flex-1 overflow-y-auto px-6 py-6">
                <Markdown>{question}</Markdown>

                <Stack gap={3}>
                    {options.map((opt) => {
                        const selected = selectedIds.includes(opt.id)
                        return (
                            <button
                                key={opt.id}
                                onClick={() => toggle(opt.id)}
                                className={cn(
                                    "group w-full rounded-xl border px-5 py-4 text-left transition-all",
                                    selected
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50 hover:bg-accent",
                                )}
                            >
                                <Group gap={4} align="center">
                                    {/* Letter circle */}
                                    <Text
                                        as="span"
                                        size="sm"
                                        weight="semibold"
                                        className={cn(
                                            "flex size-9 shrink-0 items-center justify-center border transition-colors",
                                            allowMultiple ? "rounded-md" : "rounded-full",
                                            selected
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border text-muted-foreground group-hover:border-primary/50",
                                        )}
                                    >
                                        {opt.label}
                                    </Text>

                                    <Text
                                        as="span"
                                        size="base"
                                        weight={selected ? "medium" : "normal"}
                                    >
                                        {opt.text}
                                    </Text>
                                </Group>
                            </button>
                        )
                    })}
                </Stack>
            </Stack>
        </Stack>
    )
}

export function MultipleChoiceQuestion({
    questionId,
    question,
}: {
    questionId: string
    question: ExamQuestion
}) {
    const ctx = useExamContext()
    const opts = question.options as MultipleChoiceOptions
    const options = opts.choices.map((text, i) => ({
        id: String(i),
        label: LABELS[i] ?? String(i),
        text,
    }))

    return (
        <ExamMultipleChoice
            number={question.position}
            points={Number.parseFloat(question.points)}
            question={question.prompt}
            options={options}
            selectedIds={ctx.mcqAnswers[questionId] ?? []}
            allowMultiple={opts.multipleAnswers}
            flagged={ctx.flagged[questionId] ?? false}
            onSelect={(val) => {
                ctx.setMcqAnswer(questionId, val)
                ctx.saveAnswer(questionId, {
                    type: QuestionOptionType.MultipleChoice,
                    selectedIndices: val.map(Number),
                })
            }}
            onFlag={() => ctx.toggleFlagged(questionId)}
        />
    )
}
