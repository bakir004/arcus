import * as React from "react"
import { cn } from "@/lib/utils"
import { Group, Stack, Text, Markdown } from "@/components/common"
import { Textarea } from "@/components/ui/textarea"
import { ExamQuestionHeader } from "@/features/exams/portal/components/exam-question-header"
import { useExamContext } from "@/features/exams/portal/exam-context"
import { QuestionOptionType, type ExamQuestion } from "@/features/exams/types"

const ESSAY_SAVE_DEBOUNCE = 1000
const ESSAY_STATE_DEBOUNCE = 500

interface ExamEssayProps {
    number: number
    points: number
    question: string
    value: string
    flagged: boolean
    maxWords?: number
    onChange: (value: string) => void
    onFlag: () => void
}

function countWords(text: string): number {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length
}

function ExamEssay({
    number,
    points,
    question,
    value,
    flagged,
    maxWords,
    onChange,
    onFlag,
}: ExamEssayProps) {
    const deferredValue = React.useDeferredValue(value)
    const wordCount = React.useMemo(() => countWords(deferredValue), [deferredValue])
    const isOverLimit = maxWords !== undefined && wordCount > maxWords
    const renderedQuestion = React.useMemo(() => <Markdown>{question}</Markdown>, [question])

    return (
        <Stack className="h-full">
            <ExamQuestionHeader
                number={number}
                points={points}
                prompt={question}
                typeLabel="Essay"
                flagged={flagged}
                onFlag={onFlag}
            />

            <Stack gap={5} className="flex-1 overflow-y-auto px-6 py-6">
                {renderedQuestion}

                <Stack gap={2} className="flex-1">
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Write your answer here…"
                        className={cn(
                            "min-h-64 flex-1 resize-none rounded-xl px-4 py-3 leading-relaxed",
                            "focus:border-primary focus:ring-primary/20 focus:ring-2",
                            isOverLimit
                                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                : "border-border",
                        )}
                    />

                    <Group justify="end" align="center">
                        <Text as="span" size="xs" color={isOverLimit ? "destructive" : "muted"}>
                            {wordCount}
                            {maxWords !== undefined ? ` / ${maxWords}` : ""} words
                        </Text>
                    </Group>
                </Stack>
            </Stack>
        </Stack>
    )
}

export function EssayQuestion({
    questionId,
    question,
}: {
    questionId: string
    question: ExamQuestion
}) {
    const ctx = useExamContext()
    const [draft, setDraft] = React.useState(() => ctx.essayAnswers[questionId] ?? "")
    const draftRef = React.useRef(draft)
    const saveAnswerRef = React.useRef(ctx.saveAnswer)
    const setEssayAnswerRef = React.useRef(ctx.setEssayAnswer)

    React.useEffect(() => {
        draftRef.current = draft
        saveAnswerRef.current = ctx.saveAnswer
        setEssayAnswerRef.current = ctx.setEssayAnswer
    }, [draft, ctx.saveAnswer, ctx.setEssayAnswer])

    React.useEffect(() => {
        setDraft(ctx.essayAnswers[questionId] ?? "")
    }, [questionId, ctx.essayAnswers])

    React.useEffect(() => {
        return () => {
            const text = draftRef.current
            if (!text.trim()) return
            setEssayAnswerRef.current(questionId, text)
            saveAnswerRef.current(questionId, {
                type: QuestionOptionType.Essay,
                text,
            })
        }
    }, [questionId])

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (draft !== (ctx.essayAnswers[questionId] ?? "")) {
                ctx.setEssayAnswer(questionId, draft)
            }
        }, ESSAY_STATE_DEBOUNCE)
        return () => clearTimeout(timer)
    }, [draft, questionId, ctx.essayAnswers, ctx.setEssayAnswer])

    React.useEffect(() => {
        if (!draft.trim()) return
        const timer = setTimeout(() => {
            ctx.saveAnswer(questionId, {
                type: QuestionOptionType.Essay,
                text: draft,
            })
        }, ESSAY_SAVE_DEBOUNCE)
        return () => clearTimeout(timer)
    }, [draft, questionId, ctx.saveAnswer])

    return (
        <ExamEssay
            number={question.position}
            points={Number.parseFloat(question.points)}
            question={question.prompt}
            value={draft}
            flagged={ctx.flagged[questionId] ?? false}
            maxWords={500}
            onChange={setDraft}
            onFlag={() => ctx.toggleFlagged(questionId)}
        />
    )
}
