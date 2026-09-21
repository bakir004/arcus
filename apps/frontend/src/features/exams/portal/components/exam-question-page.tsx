import * as React from "react"
import { useExamContext } from "@/features/exams/portal/exam-context"
import { MultipleChoiceQuestion } from "./mcq/exam-multiple-choice"
import { EssayQuestion } from "./essay/exam-essay"
import { CodingQuestion } from "./coding/exam-coding"
import { QuestionOptionType } from "@/features/exams/types"
import { Text } from "@/components/common"

interface ExamQuestionPageProps {
    examId: string
    attemptId: string
    questionPosition: string
}

export function ExamQuestionPage({ questionPosition }: ExamQuestionPageProps) {
    const ctx = useExamContext()

    const activeQuestionPosition = Number(questionPosition)

    React.useEffect(() => {
        ctx.setActiveQuestionPosition(
            Number.isNaN(activeQuestionPosition) ? null : activeQuestionPosition,
        )
    }, [activeQuestionPosition, ctx])

    const index = activeQuestionPosition - 1
    const question = ctx.questions[index]
    const questionId = question?.id ?? ""

    if (!question) {
        return (
            <Text
                as="div"
                size="sm"
                color="muted"
                className="flex h-full items-center justify-center"
            >
                Question not found.
            </Text>
        )
    }

    if (question.options.type === QuestionOptionType.MultipleChoice) {
        return <MultipleChoiceQuestion questionId={questionId} question={question} />
    }

    if (question.options.type === QuestionOptionType.Essay) {
        return <EssayQuestion questionId={questionId} question={question} />
    }

    if (question.options.type === QuestionOptionType.Coding) {
        return <CodingQuestion questionId={questionId} question={question} />
    }

    return null
}
