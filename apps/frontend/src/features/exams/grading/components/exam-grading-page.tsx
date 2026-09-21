import * as React from "react"
import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-java"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-sql"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { CheckCircle2, ChevronDown, FileSearch, Mic, Move, MoveHorizontal, MoveVertical, Sparkles, Square, XCircle } from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"
import { Box, Group, Heading, Markdown, Stack, Text } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/lib/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { useGetExam } from "@/features/exams/portal/api/get-exam"
import { useGetExamQuestionsForAuthoring } from "@/features/exams/portal/api/get-exam-questions"
import { useGetExamAttempts } from "@/features/exams/list/api/get-exam-attempts"
import { useGetExamAnswerTable } from "@/features/exams/grading/api/get-exam-answer-table"
import { gradeAnswerRequest } from "@/features/exams/grading/api/grade-answer"
import type {
    ExamAnswerTable,
    ExamAnswerTableCell,
    ExamAnswerTableQuestion,
    CodingExecutionTestResult,
    ExamQuestion,
} from "@/features/exams/types"

function toSelectedIndices(answer: Record<string, unknown>): number[] {
    const selected = answer.selectedIndices
    if (!Array.isArray(selected)) return []
    return selected.filter((value): value is number => typeof value === "number")
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

function getSocketUrl() {
    const url = new URL(API_BASE_URL, window.location.origin)
    url.pathname = ""
    url.search = ""
    url.hash = ""
    return url.toString().replace(/\/$/, "")
}

function floatTo16BitPcm(samples: Float32Array) {
    const buffer = new ArrayBuffer(samples.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < samples.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, samples[i]))
        view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    }
    return new Uint8Array(buffer)
}

function resampleLinear(input: Float32Array, inputRate: number, outputRate: number) {
    if (inputRate === outputRate) return input
    const outputLength = Math.max(1, Math.round((input.length * outputRate) / inputRate))
    const output = new Float32Array(outputLength)
    const ratio = (input.length - 1) / Math.max(1, outputLength - 1)
    for (let i = 0; i < outputLength; i += 1) {
        const position = i * ratio
        const left = Math.floor(position)
        const right = Math.min(left + 1, input.length - 1)
        const weight = position - left
        output[i] = input[left] * (1 - weight) + input[right] * weight
    }
    return output
}

function bytesToBase64(bytes: Uint8Array) {
    let binary = ""
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
}

function GradingDictationPanel({
    answerTable,
    questions,
    selectedCell,
    onSelectCell,
    onSaveScore,
}: {
    answerTable?: ExamAnswerTable
    questions?: ExamQuestion[]
    selectedCell?: SelectedGradingCell | null
    onSelectCell?: (cell: SelectedGradingCell) => void
    onSaveScore?: (attemptId: string, questionId: string, score: number) => Promise<void>
}) {
    const [isListening, setIsListening] = React.useState(false)
    const [status, setStatus] = React.useState("Idle")
    const [partialTranscript, setPartialTranscript] = React.useState("")
    const [transcripts, setTranscripts] = React.useState<string[]>([])
    const [functions, setFunctions] = React.useState<string[]>([])
    const [isInterpreting, setIsInterpreting] = React.useState(false)
    const processedFunctionCountRef = React.useRef(0)
    const activeStudentAttemptIdRef = React.useRef<string | null>(null)
    const socketRef = React.useRef<Socket | null>(null)
    const streamRef = React.useRef<MediaStream | null>(null)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const processorRef = React.useRef<ScriptProcessorNode | null>(null)
    const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null)
    const hasSpeechRef = React.useRef(false)
    const candidateSpeechMsRef = React.useRef(0)
    const silenceMsRef = React.useRef(0)
    const preRollRef = React.useRef<Array<{ audio: string; ms: number }>>([])

    const stopListening = React.useCallback(() => {
        processorRef.current?.disconnect()
        sourceRef.current?.disconnect()
        void audioContextRef.current?.close()
        streamRef.current?.getTracks().forEach((track) => { track.stop() })
        socketRef.current?.emit("grading:stop")
        socketRef.current?.disconnect()

        processorRef.current = null
        sourceRef.current = null
        audioContextRef.current = null
        streamRef.current = null
        socketRef.current = null
        hasSpeechRef.current = false
        candidateSpeechMsRef.current = 0
        silenceMsRef.current = 0
        preRollRef.current = []
        setIsListening(false)
        setPartialTranscript("")
        setStatus("Idle")
    }, [])

    const startListening = React.useCallback(async () => {
        setStatus("Requesting microphone...")
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        const socket = io(`${getSocketUrl()}/grading`, { withCredentials: true })

        streamRef.current = stream
        audioContextRef.current = audioContext
        sourceRef.current = source
        processorRef.current = processor
        socketRef.current = socket

        socket.on("connect", () => {
            setStatus("Connected. Listening...")
            socket.emit("grading:start")
        })
        socket.on("grading:ready", () => setStatus("Listening. Start dictating."))
        socket.on("grading:transcript_delta", ({ text }: { text?: string }) => {
            setPartialTranscript(text ?? "")
        })
        socket.on("grading:transcript_final", ({ text }: { text?: string }) => {
            if (text?.trim()) setTranscripts((current) => [...current, text.trim()])
            setPartialTranscript("")
        })
        socket.on("grading:functions_interpreting", () => setIsInterpreting(true))
        socket.on("grading:functions_updated", ({ functions }: { functions?: string[] }) => {
            setFunctions(functions ?? [])
            setIsInterpreting(false)
        })
        socket.on("grading:error", (error) => {
            setStatus(`Error: ${error?.message ?? "Realtime transcription failed"}`)
        })
        socket.on("disconnect", () => setStatus("Disconnected"))

        processor.onaudioprocess = (event) => {
            if (!socket.connected) return
            const input = event.inputBuffer.getChannelData(0)

            let sumSquares = 0
            for (let i = 0; i < input.length; i += 1) sumSquares += input[i] * input[i]
            const rms = Math.sqrt(sumSquares / input.length)
            const chunkMs = (input.length / audioContext.sampleRate) * 1000
            const isSpeech = rms > 0.018
            const resampled = resampleLinear(input, audioContext.sampleRate, 24000)
            const audio = bytesToBase64(floatTo16BitPcm(resampled))

            if (!hasSpeechRef.current) {
                preRollRef.current.push({ audio, ms: chunkMs })
                let preRollMs = preRollRef.current.reduce((sum, chunk) => sum + chunk.ms, 0)
                while (preRollMs > 500 && preRollRef.current.length > 1) {
                    const removed = preRollRef.current.shift()
                    preRollMs -= removed?.ms ?? 0
                }
            }

            if (isSpeech) {
                candidateSpeechMsRef.current += chunkMs
                silenceMsRef.current = 0
                if (!hasSpeechRef.current && candidateSpeechMsRef.current >= 300) {
                    hasSpeechRef.current = true
                    for (const chunk of preRollRef.current) {
                        socket.emit("grading:audio_append", { audio: chunk.audio })
                    }
                    preRollRef.current = []
                }
            } else if (hasSpeechRef.current) {
                silenceMsRef.current += chunkMs
            } else {
                candidateSpeechMsRef.current = 0
            }

            if (hasSpeechRef.current) {
                socket.emit("grading:audio_append", { audio })
            }

            if (hasSpeechRef.current && silenceMsRef.current >= 1500) {
                socket.emit("grading:audio_commit")
                hasSpeechRef.current = false
                candidateSpeechMsRef.current = 0
                silenceMsRef.current = 0
                preRollRef.current = []
            }
        }

        source.connect(processor)
        processor.connect(audioContext.destination)
        setIsListening(true)
    }, [])

    React.useEffect(() => stopListening, [stopListening])

    React.useEffect(() => {
        if (!answerTable || !questions?.length || !onSelectCell) return

        const selectCell = (row: GradingTableRow, tableQuestion: ExamAnswerTableQuestion) => {
            const question = questions.find((q) => q.id === tableQuestion.id)
            const cell = row.answers.find((answer) => answer.questionId === tableQuestion.id)
            onSelectCell({ row, tableQuestion, question, cell })
        }

        const findStudentRow = (studentIndex: string) => {
            const normalized = studentIndex.toLowerCase().trim()
            return answerTable.rows.find(
                (row) => row.studentFacultyIndex?.toLowerCase().trim() === normalized,
            )
        }

        for (const fn of functions.slice(processedFunctionCountRef.current)) {
            const studentMatch = fn.match(/^student\(\s*["']?([^"')]+)["']?\s*\)$/i)
            if (studentMatch) {
                const row = findStudentRow(studentMatch[1])
                const firstQuestion = answerTable.questions[0]
                if (row && firstQuestion) {
                    activeStudentAttemptIdRef.current = row.attemptId
                    selectCell(row, firstQuestion)
                }
                continue
            }

            const setMatch = fn.match(/^set\(\s*(\d+)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/i)
            if (setMatch && onSaveScore) {
                const row =
                    answerTable.rows.find((candidate) => candidate.attemptId === activeStudentAttemptIdRef.current) ??
                    selectedCell?.row
                const tableQuestion = answerTable.questions.find(
                    (question) => question.position === Number(setMatch[1]),
                )
                const requestedScore = Number(setMatch[2])
                const question = questions.find((candidate) => candidate.id === tableQuestion?.id)
                const answer = row?.answers.find((candidate) => candidate.questionId === tableQuestion?.id)
                if (row && tableQuestion && question && answer && Number.isFinite(requestedScore)) {
                    const maxPoints = Math.max(0, Number(question.points))
                    const score = Math.min(Math.max(requestedScore, 0), maxPoints)
                    selectCell(row, tableQuestion)
                    setStatus(`Saving Q${tableQuestion.position}: ${formatScore(score)} points…`)
                    void onSaveScore(row.attemptId, tableQuestion.id, score)
                        .then(() => {
                            setStatus(`Saved Q${tableQuestion.position}: ${formatScore(score)} points`)
                            toast.success(`Saved Q${tableQuestion.position} score.`)
                        })
                        .catch((error) => {
                            setStatus(`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`)
                            toast.error(`Could not save Q${tableQuestion.position} score.`)
                        })
                } else if (row && tableQuestion && !answer) {
                    setStatus(`Q${tableQuestion.position} is unanswered and cannot be graded.`)
                }
            }
        }

        processedFunctionCountRef.current = functions.length
    }, [answerTable, functions, onSaveScore, onSelectCell, questions, selectedCell])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Live grading dictation</CardTitle>
            </CardHeader>
            <CardContent>
                <Stack gap={3}>
                    <Group gap={3} align="center">
                        <Button
                            type="button"
                            variant={isListening ? "destructive" : "default"}
                            onClick={() => {
                                if (isListening) stopListening()
                                else
                                    void startListening().catch((error) => {
                                        setStatus(
                                            `Error: ${error?.message ?? "Could not start microphone"}`,
                                        )
                                        stopListening()
                                    })
                            }}
                        >
                            {isListening ? (
                                <Square className="size-4" />
                            ) : (
                                <Mic className="size-4" />
                            )}
                            {isListening ? "Stop listening" : "Start dictation"}
                        </Button>
                        <Text size="sm" color="muted">
                            {status}
                        </Text>
                    </Group>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Text size="xs" color="muted" className="mb-1 block">
                                Transcript
                            </Text>
                            <div className="min-h-28 rounded-md border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                                {transcripts.length || partialTranscript ? (
                                    <>
                                        {transcripts.join("\n")}
                                        {partialTranscript ? `\n${partialTranscript}` : ""}
                                    </>
                                ) : (
                                    <Text size="sm" color="muted">
                                        Dictated text will appear here.
                                    </Text>
                                )}
                            </div>
                        </div>
                        <div>
                            <Group justify="between" align="center" className="mb-1">
                                <Text size="xs" color="muted" className="block">
                                    Understood functions
                                </Text>
                                {isInterpreting ? (
                                    <Text size="xs" color="muted">
                                        Updating...
                                    </Text>
                                ) : null}
                            </Group>
                            <div className="min-h-28 rounded-md border bg-muted/20 p-3 font-mono text-sm whitespace-pre-wrap">
                                {functions.length ? (
                                    functions.join("\n")
                                ) : (
                                    <Text size="sm" color="muted">
                                        Function calls will appear here.
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                </Stack>
            </CardContent>
        </Card>
    )
}

type GradingTableRow = ExamAnswerTable["rows"][number]

type SelectedGradingCell = {
    row: GradingTableRow
    tableQuestion: ExamAnswerTableQuestion
    question: ExamQuestion | undefined
    cell: ExamAnswerTableCell | undefined
}

function formatScore(value: string | number) {
    const number = Number(value)
    if (!Number.isFinite(number)) return String(value)
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)))
}

function scoreForCell(cell: ExamAnswerTableCell | undefined) {
    if (!cell) return ""
    return formatScore(cell.score ?? 0)
}

function mcqAutoScore(question: ExamQuestion | undefined, cell: ExamAnswerTableCell | undefined) {
    if (!question || !cell || question.options.type !== "multiple_choice") return null
    const selectedIndices = toSelectedIndices(cell.answer)
    const correctIndices = question.options.correctIndices
    const selected = new Set(selectedIndices)
    const correct = new Set(correctIndices)
    const isCorrect = selected.size === correct.size && [...selected].every((index) => correct.has(index))
    return isCorrect ? Number(question.points) : 0
}

function prismLanguageForAnswer(cell: ExamAnswerTableCell, question: ExamQuestion | undefined) {
    const answerLanguage = typeof cell.answer.language === "string" ? cell.answer.language : undefined
    const questionLanguage = question?.options.type === "coding" ? question.options.language : undefined
    const language = answerLanguage ?? questionLanguage ?? "javascript"
    return language === "cpp" ? "cpp" : language
}

function GradingQuestionPromptButton({
    question,
    children,
}: {
    question: ExamAnswerTableQuestion
    children: React.ReactNode
}) {
    const [isPromptOpen, setIsPromptOpen] = React.useState(false)

    return (
        <>
            <button
                type="button"
                data-preserve-score-selection="true"
                className="w-full cursor-pointer rounded underline-offset-4 hover:underline hover:decoration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsPromptOpen(true)}
            >
                {children}
            </button>
            <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{`Q${question.position} problem statement`}</DialogTitle>
                        <DialogDescription>Full prompt for this exam question.</DialogDescription>
                    </DialogHeader>
                    <Box className="max-h-[70vh] overflow-auto rounded-md border p-4">
                        <Markdown>{question.prompt}</Markdown>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}

function HighlightedCodePreview({ code, language }: { code: string; language: string }) {
    const { isDark } = useTheme()
    const grammar = Prism.languages[language] ?? Prism.languages.javascript
    const highlighted = Prism.highlight(code, grammar, language)

    return (
        <pre
            className={`max-h-80 overflow-auto rounded-md border bg-background p-3 font-mono text-xs ${
                isDark ? "prism-theme-dark" : "prism-theme-light"
            }`}
        >
            <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        </pre>
    )
}

function ExecutionTestRow({ test, index, expectedOutput, language }: { test: CodingExecutionTestResult; index: number; expectedOutput?: string; language: string }) {
    const [open, setOpen] = React.useState(false)
    const studentOutput = test.stderr || test.error || test.stdout || (test.timedOut ? "Timed out" : "No output")
    return (
        <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-md border bg-card">
            <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60">
                <Badge variant={test.passed ? "outline" : "destructive"} className={`w-20 justify-center gap-1 ${test.passed ? "border-success/40 bg-success/10 text-success" : ""}`}>
                    {test.passed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                    {test.passed ? "Passed" : "Failed"}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{test.name ?? `Test ${index + 1}`}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="grid gap-3 border-t bg-muted/20 p-3 md:grid-cols-2">
                    <Stack gap={1}>
                        <Text size="xs" weight="medium" color="muted">Expected output</Text>
                        <pre className="max-h-40 overflow-auto rounded-md border bg-background p-2 font-mono text-xs whitespace-pre-wrap">{test.expectedOutput ?? expectedOutput ?? "No expected output configured"}</pre>
                    </Stack>
                    <Stack gap={1}>
                        <Text size="xs" weight="medium" color="muted">Student output / error</Text>
                        <pre className={`max-h-40 overflow-auto rounded-md border bg-background p-2 font-mono text-xs whitespace-pre-wrap ${test.passed ? "" : "text-destructive"}`}>{studentOutput}</pre>
                    </Stack>
                    <Stack gap={1} className="md:col-span-2">
                        <Text size="xs" weight="medium" color="muted">Assembled execution file</Text>
                        {test.assembledCode ? (
                            <HighlightedCodePreview code={test.assembledCode} language={language} />
                        ) : (
                            <Text size="xs" color="muted" className="rounded-md border bg-background p-3">
                                Execution context was not recorded for this run.
                            </Text>
                        )}
                    </Stack>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

function CodingAnswerPreview({
    cell,
    question,
}: {
    cell: ExamAnswerTableCell
    question: ExamQuestion | undefined
}) {
    const code = typeof cell.answer.code === "string" ? cell.answer.code : ""
    const language = prismLanguageForAnswer(cell, question)
    const execution = cell.executionResult
    const passedTests = execution?.tests.filter((test) => test.passed).length ?? 0
    return (
        <Stack gap={3}>
            <Stack gap={1}>
                <Text size="xs" color="muted">
                    Student code
                </Text>
                {code ? (
                    <HighlightedCodePreview code={code} language={language} />
                ) : (
                    <Text
                        as="p"
                        size="xs"
                        className="rounded-md border bg-background p-3 font-mono whitespace-pre-wrap"
                    >
                        No code submitted.
                    </Text>
                )}
            </Stack>
            {execution ? (
                <Stack gap={2} className="rounded-md border bg-background p-3">
                    <Text size="xs" weight="medium">
                        Latest run: {execution.passed ? "Passed" : "Failed"} · {passedTests}/{execution.tests.length} tests passed
                    </Text>
                    {!execution.compile.passed ? (
                        <Text size="xs" className="whitespace-pre-wrap text-destructive">
                            {execution.compile.stderr || execution.compile.error || "Compilation failed"}
                        </Text>
                    ) : null}
                    <Stack gap={2}>
                        {execution.tests.map((test, index) => (
                            <ExecutionTestRow
                                key={test.id ?? index}
                                test={test}
                                index={index}
                                expectedOutput={question?.options.type === "coding" ? question.options.testCases[index]?.expectedStdout ?? question.options.testCases[index]?.expectedOutput : undefined}
                                language={language}
                            />
                        ))}
                    </Stack>
                    {cell.executedAt ? <Text size="xs" color="muted">Run {new Date(cell.executedAt).toLocaleString()}</Text> : null}
                </Stack>
            ) : (
                <Text size="xs" color="muted">The student has not run the tests yet.</Text>
            )}
        </Stack>
    )
}

function SelectedAnswerPreview({ selected }: { selected: SelectedGradingCell | null }) {
    const [showPrompt, setShowPrompt] = React.useState(false)

    if (!selected) {
        return (
            <Card className="h-full">
                <CardContent className="flex h-full min-h-[420px] items-center justify-center">
                    <Stack gap={3} align="center" className="max-w-xs text-center">
                        <Box className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileSearch className="size-6" />
                        </Box>
                        <Stack gap={1} align="center">
                            <Heading level={3} size="sm">
                                Select an answer
                            </Heading>
                            <Text size="sm" color="muted">
                                Click any score cell to preview the student's submitted answer here.
                            </Text>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        )
    }

    const { row, tableQuestion, question, cell } = selected
    const selectedIndices = cell ? toSelectedIndices(cell.answer) : []
    const autoScore = mcqAutoScore(question, cell)

    return (
        <>
            <Card className="h-full overflow-hidden">
            <CardHeader>
                <CardTitle>
                    <button
                        type="button"
                        data-preserve-score-selection="true"
                        className="cursor-pointer rounded text-left font-semibold hover:underline underline-offset-4 hover:decoration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setShowPrompt(true)}
                    >
                        {`Q${tableQuestion.position}`}
                    </button>
                    {` · ${row.studentName}`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Stack gap={4}>
                    <Group gap={4} className="flex-wrap">
                        <Text size="xs" color="muted">
                            Student: {row.studentFacultyIndex ?? row.studentId}
                        </Text>
                        <Text size="xs" color="muted">
                            Score: {cell?.score ?? "0"} / {question?.points ?? "-"}
                        </Text>
                        {autoScore !== null ? (
                            <Text size="xs" color="muted">
                                Autograded: {autoScore} / {question?.points ?? "-"}
                            </Text>
                        ) : null}
                    </Group>

                    {!cell ? (
                        <Text size="sm" color="muted">
                            No answer submitted.
                        </Text>
                    ) : question && question.options.type === "multiple_choice" ? (
                        <Stack gap={2}>
                            <Text size="xs" color="muted">
                                Choices
                            </Text>
                            {question.options.choices.map((choice, index) => {
                                const isSelected = selectedIndices.includes(index)
                                const isCorrect = (question.options as { correctIndices: number[] }).correctIndices.includes(index)
                                return (
                                    <Group
                                        key={index}
                                        gap={3}
                                        align="start"
                                        className={`rounded-md border px-3 py-2 ${
                                            isSelected && isCorrect
                                                ? "border-success/50 bg-success/10"
                                                : isSelected && !isCorrect
                                                  ? "border-destructive/50 bg-destructive/10"
                                                  : isCorrect
                                                    ? "border-warning/50 bg-warning/10"
                                                    : "border-border"
                                        }`}
                                    >
                                        <Text as="span" size="xs" weight="bold" className="w-5">
                                            {String.fromCharCode(65 + index)}
                                        </Text>
                                        <Stack gap={1} className="min-w-0 flex-1">
                                            <Text size="sm">{choice}</Text>
                                            <Text
                                                size="xs"
                                                className={
                                                    isSelected && isCorrect
                                                        ? "text-success"
                                                        : isSelected && !isCorrect
                                                          ? "text-destructive"
                                                          : isCorrect
                                                            ? "text-warning"
                                                            : "text-muted-foreground"
                                                }
                                            >
                                                {isSelected && isCorrect
                                                    ? "Student selected · correct"
                                                    : isSelected
                                                      ? "Student selected · incorrect"
                                                      : isCorrect
                                                        ? "Correct answer"
                                                        : "Not selected"}
                                            </Text>
                                        </Stack>
                                    </Group>
                                )
                            })}
                        </Stack>
                    ) : question?.options.type === "essay" ? (
                        <Stack gap={1}>
                            <Text size="xs" color="muted">
                                Essay answer
                            </Text>
                            <Text as="p" className="max-h-96 overflow-auto rounded-md border p-3 whitespace-pre-wrap">
                                {typeof cell.answer.text === "string" && cell.answer.text.trim()
                                    ? cell.answer.text
                                    : "No essay text submitted."}
                            </Text>
                        </Stack>
                    ) : question?.options.type === "coding" ? (
                        <CodingAnswerPreview cell={cell} question={question} />
                    ) : null}

                    {cell?.feedback ? (
                        <Stack gap={1}>
                            <Text size="xs" color="muted">
                                Feedback
                            </Text>
                            <Text as="p" className="rounded-md border p-3 whitespace-pre-wrap">
                                {cell.feedback}
                            </Text>
                        </Stack>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
            <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{`Q${tableQuestion.position} problem statement`}</DialogTitle>
                        <DialogDescription>Full prompt for this exam question.</DialogDescription>
                    </DialogHeader>
                    <Box className="max-h-[70vh] overflow-auto rounded-md border p-4">
                        <Markdown>{tableQuestion.prompt}</Markdown>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}

type GradingNavigationMode = "free" | "horizontal" | "vertical"

type DictatedScoreAction = {
    attemptId: string
    questionId: string
    score: number
    nonce: number
}

function ExamGradingScoreTable({
    answerTable,
    questions,
    selectedCell,
    navigationMode,
    onSelectCell,
    onSaveScore,
    dictatedScoreAction,
}: {
    answerTable: ExamAnswerTable
    questions: ExamQuestion[]
    selectedCell: SelectedGradingCell | null
    navigationMode: GradingNavigationMode
    onSelectCell: (cell: SelectedGradingCell) => void
    onSaveScore: (attemptId: string, questionId: string, score: number) => Promise<void>
    dictatedScoreAction?: DictatedScoreAction | null
}) {
    const parentRef = React.useRef<HTMLDivElement>(null)
    const questionById = React.useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])
    const [draftScores, setDraftScores] = React.useState<Record<string, string>>({})

    React.useEffect(() => {
        if (!dictatedScoreAction) return
        const key = `${dictatedScoreAction.attemptId}:${dictatedScoreAction.questionId}`
        setDraftScores((current) => ({ ...current, [key]: formatScore(dictatedScoreAction.score) }))
    }, [dictatedScoreAction])

    const columns = React.useMemo<ColumnDef<GradingTableRow>[]>(
        () => [
            { id: "student", header: "Student", size: 180 },
            ...answerTable.questions.map<ColumnDef<GradingTableRow>>((question) => ({
                id: question.id,
                header: `Q${question.position} /${formatScore(questionById.get(question.id)?.points ?? "-")}`,
                size: 44,
            })),
            {
                id: "total",
                header: `Total /${formatScore(questions.reduce((sum, question) => sum + Number(question.points), 0))}`,
                size: 64,
            },
        ],
        [answerTable.questions, questionById, questions],
    )
    const table = useReactTable({
        data: answerTable.rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })
    const rows = table.getRowModel().rows
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 32,
        getItemKey: (index) => rows[index]?.original.attemptId ?? index,
        overscan: 12,
    })
    const virtualRows = rowVirtualizer.getVirtualItems()
    const topPadding = virtualRows[0]?.start ?? 0
    const bottomPadding = rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    const selectedAttemptId = selectedCell?.row.attemptId
    const selectedQuestionId = selectedCell?.tableQuestion.id

    const commitScore = async (attemptId: string, questionId: string, maxPointsRaw: string | undefined) => {
        const key = `${attemptId}:${questionId}`
        const value = draftScores[key]
        if (value === undefined) return
        const parsed = Number(value)
        if (Number.isNaN(parsed)) return
        const maxPoints = Number(maxPointsRaw ?? 0)
        const bounded = Number.isFinite(maxPoints) ? Math.min(Math.max(parsed, 0), maxPoints) : Math.max(parsed, 0)
        await onSaveScore(attemptId, questionId, bounded)
    }

    const focusScoreCell = (rowIndex: number, questionIndex: number) => {
        const nextRowIndex = Math.max(0, Math.min(rows.length - 1, rowIndex))
        const nextQuestionIndex = Math.max(
            0,
            Math.min(answerTable.questions.length - 1, questionIndex),
        )

        rowVirtualizer.scrollToIndex(nextRowIndex, { align: "auto" })
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                const input = parentRef.current?.querySelector<HTMLInputElement>(
                    `[data-score-cell="${nextRowIndex}:${nextQuestionIndex}"]`,
                )
                const container = parentRef.current
                if (input && container) {
                    const stickyStudentCell = container.querySelector<HTMLElement>(
                        '[data-student-cell="true"]',
                    )
                    const stickyWidth = stickyStudentCell?.offsetWidth ?? 180
                    const containerRect = container.getBoundingClientRect()
                    const inputRect = input.getBoundingClientRect()
                    const borderBuffer = 4
                    const visibleLeft = containerRect.left + stickyWidth + borderBuffer
                    const visibleRight = containerRect.right - borderBuffer

                    if (inputRect.left < visibleLeft) {
                        container.scrollLeft -= visibleLeft - inputRect.left
                    } else if (inputRect.right > visibleRight) {
                        container.scrollLeft += inputRect.right - visibleRight
                    }
                }
                input?.focus()
                input?.select()
            })
        })
    }

    const focusNextAnsweredCell = (
        rowIndex: number,
        questionIndex: number,
        rowDelta: number,
        questionDelta: number,
    ) => {
        let nextRow = rowIndex + rowDelta
        let nextQuestion = questionIndex + questionDelta
        while (
            nextRow >= 0 && nextRow < rows.length &&
            nextQuestion >= 0 && nextQuestion < answerTable.questions.length
        ) {
            const questionId = answerTable.questions[nextQuestion]?.id
            if (rows[nextRow]?.original.answers.some((answer) => answer.questionId === questionId)) {
                focusScoreCell(nextRow, nextQuestion)
                return
            }
            nextRow += rowDelta
            nextQuestion += questionDelta
        }
    }

    const handleScoreKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
        rowIndex: number,
        questionIndex: number,
        key: string,
    ) => {
        const input = event.currentTarget
        const cursorStart = input.selectionStart ?? 0
        const cursorEnd = input.selectionEnd ?? 0
        const hasSelection = cursorStart !== cursorEnd
        const isFullSelection = cursorStart === 0 && cursorEnd === input.value.length

        const canMoveVertically = navigationMode !== "horizontal"
        const canMoveHorizontally = navigationMode !== "vertical"

        if (event.key === "ArrowUp") {
            if (!canMoveVertically) return
            event.preventDefault()
            focusNextAnsweredCell(rowIndex, questionIndex, -1, 0)
        } else if (event.key === "ArrowDown") {
            if (!canMoveVertically) return
            event.preventDefault()
            focusNextAnsweredCell(rowIndex, questionIndex, 1, 0)
        } else if (event.key === "ArrowLeft" && (!hasSelection || isFullSelection) && cursorStart === 0) {
            if (!canMoveHorizontally) return
            event.preventDefault()
            focusNextAnsweredCell(rowIndex, questionIndex, 0, -1)
        } else if (
            event.key === "ArrowRight" &&
            (!hasSelection || isFullSelection) &&
            cursorEnd === input.value.length
        ) {
            if (!canMoveHorizontally) return
            event.preventDefault()
            focusNextAnsweredCell(rowIndex, questionIndex, 0, 1)
        } else if (event.key === "Enter") {
            event.preventDefault()
            if (navigationMode === "horizontal") {
                focusNextAnsweredCell(rowIndex, questionIndex, 0, 1)
            } else {
                focusNextAnsweredCell(rowIndex, questionIndex, 1, 0)
            }
        } else if (event.key === "Escape") {
            setDraftScores((current) => {
                const next = { ...current }
                delete next[key]
                return next
            })
            input.blur()
        }
    }

    return (
        <Box ref={parentRef} className="h-[calc(100dvh-18rem)] min-h-[420px] overflow-auto rounded-lg border">
            <table className="w-full min-w-max border-separate border-spacing-0 text-xs">
                <thead className="sticky top-0 z-20 bg-background">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header, index) => {
                                const tableQuestion = answerTable.questions.find(
                                    (question) => question.id === header.column.id,
                                )
                                const isSelectedQuestionHeader = tableQuestion?.id === selectedQuestionId
                                return (
                                    <th
                                        key={header.id}
                                        style={{ width: header.column.columnDef.size }}
                                        className={`border-b py-2 text-center font-medium ${
                                            isSelectedQuestionHeader
                                                ? "bg-primary/20 outline outline-1 -outline-offset-1 outline-primary"
                                                : "bg-background"
                                        } ${
                                            index === 0
                                                ? "sticky left-0 z-30 border-r px-2 text-left"
                                                : index === headerGroup.headers.length - 1
                                                  ? "px-0"
                                                  : "border-r px-0"
                                        }`}
                                    >
                                        {tableQuestion ? (
                                            <GradingQuestionPromptButton question={tableQuestion}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </GradingQuestionPromptButton>
                                        ) : (
                                            flexRender(header.column.columnDef.header, header.getContext())
                                        )}
                                    </th>
                                )
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {topPadding > 0 ? (
                        <tr>
                            <td style={{ height: topPadding }} colSpan={columns.length} />
                        </tr>
                    ) : null}
                    {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index].original
                        const byQuestionId = new Map(row.answers.map((cell) => [cell.questionId, cell]))
                        const totalScore = row.answers.reduce(
                            (sum, cell) => sum + Number(cell.score ?? 0),
                            0,
                        )
                        const totalPossible = questions.reduce(
                            (sum, question) => sum + Number(question.points),
                            0,
                        )
                        const passesDummyThreshold = totalScore >= totalPossible * 0.5
                        const isSelectedRow = selectedAttemptId === row.attemptId
                        return (
                            <tr key={row.attemptId}>
                                <td
                                    data-student-cell="true"
                                    className={`sticky left-0 z-50 border-r border-b px-2 py-1.5 ${
                                        isSelectedRow
                                            ? "bg-primary/20 outline outline-1 -outline-offset-1 outline-primary"
                                            : "bg-background"
                                    }`}
                                >
                                    <Stack gap={0}>
                                        <Text size="xs" weight="medium" truncate>
                                            {row.studentName}
                                        </Text>
                                        <Text size="xs" color="muted" truncate>
                                            {row.studentFacultyIndex ?? row.studentId.slice(0, 8)}
                                        </Text>
                                    </Stack>
                                </td>
                                {answerTable.questions.map((tableQuestion, questionIndex) => {
                                    const cell = byQuestionId.get(tableQuestion.id)
                                    const question = questionById.get(tableQuestion.id)
                                    const key = `${row.attemptId}:${tableQuestion.id}`
                                    const isSelected =
                                        selectedCell?.row.attemptId === row.attemptId &&
                                        selectedCell.tableQuestion.id === tableQuestion.id
                                    const isSelectedColumn = selectedQuestionId === tableQuestion.id
                                    const isHighlightedAxis = isSelectedRow || isSelectedColumn
                                    const value = draftScores[key] ?? scoreForCell(cell)
                                    return (
                                        <td
                                            key={key}
                                            className={`relative !h-8 border-r border-b p-0 ${
                                                isSelected ? "z-20" : ""
                                            }`}
                                        >
                                            <Input
                                                value={value}
                                                inputMode="decimal"
                                                disabled={!cell}
                                                data-score-cell={`${virtualRow.index}:${questionIndex}`}
                                                onFocus={(event) => {
                                                    onSelectCell({ row, tableQuestion, question, cell })
                                                    event.currentTarget.select()
                                                }}
                                                onClick={(event) => {
                                                    onSelectCell({ row, tableQuestion, question, cell })
                                                    event.currentTarget.select()
                                                }}
                                                onMouseUp={(event) => event.preventDefault()}
                                                onChange={(event) => {
                                                    const raw = event.target.value
                                                    const parsed = Number(raw)
                                                    const maxPoints = Number(question?.points ?? 0)
                                                    const upperBound = Math.max(0, maxPoints)
                                                    const value = raw === "" || !Number.isFinite(parsed)
                                                        ? raw
                                                        : parsed < 0
                                                          ? "0"
                                                          : parsed > upperBound
                                                            ? String(upperBound)
                                                            : raw
                                                    setDraftScores((current) => ({ ...current, [key]: value }))
                                                }}
                                                onBlur={() => {
                                                    void commitScore(row.attemptId, tableQuestion.id, question?.points)
                                                }}
                                                onKeyDown={(event) =>
                                                    handleScoreKeyDown(event, virtualRow.index, questionIndex, key)
                                                }
                                                className={`absolute inset-0 !h-full !w-full rounded-none border-0 !px-0 !py-0 text-center text-xs leading-none shadow-none focus-visible:ring-0 ${
                                                    isSelected
                                                        ? "!border !border-primary bg-primary/20 outline outline-2 -outline-offset-2 outline-primary dark:bg-primary/25"
                                                        : isHighlightedAxis
                                                          ? "bg-primary/10 dark:bg-primary/15"
                                                          : "bg-transparent hover:bg-accent/60"
                                                }`}
                                            />
                                        </td>
                                    )
                                })}
                                <td className="relative !h-8 border-b p-0">
                                    <Group
                                        justify="center"
                                        align="center"
                                        className={
                                            passesDummyThreshold
                                                ? "absolute inset-0 bg-success/10 text-success"
                                                : "absolute inset-0 bg-destructive/10 text-destructive"
                                        }
                                    >
                                        <Text as="span" size="sm" weight="semibold" className="inherit">
                                            {formatScore(totalScore)}
                                        </Text>
                                    </Group>
                                </td>
                            </tr>
                        )
                    })}
                    {bottomPadding > 0 ? (
                        <tr>
                            <td style={{ height: bottomPadding }} colSpan={columns.length} />
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </Box>
    )
}

export function ExamGradingPage({ examId }: { examId: string }) {
    const navigate = useNavigate()
    const { userId: graderId } = useAuth()
    const [view, setView] = React.useState<"table" | "dictation">("table")
    const [navigationMode, setNavigationMode] = React.useState<GradingNavigationMode>("free")
    const [selectedTableCell, setSelectedTableCell] = React.useState<SelectedGradingCell | null>(null)
    const [dictatedScoreAction, setDictatedScoreAction] = React.useState<DictatedScoreAction | null>(null)

    const { data: exam } = useGetExam(examId)
    const courseId = exam?.courseId
    const { data: questions = [] } = useGetExamQuestionsForAuthoring(courseId, examId)
    const { data: attempts = [] } = useGetExamAttempts(
        courseId,
        examId,
        graderId || "prof",
    )
    const { data: answerTable, isLoading: answerTableLoading } = useGetExamAnswerTable(
        courseId,
        examId,
    )
    const queryClient = useQueryClient()

    const autograde = useMutation({
        mutationFn: async () => {
            if (!courseId || !answerTable) return 0
            const grades: Array<{ attemptId: string; questionId: string; score: number }> = []
            const questionsById = new Map(questions.map((question) => [question.id, question]))

            for (const row of answerTable.rows) {
                for (const cell of row.answers) {
                    const question = questionsById.get(cell.questionId)
                    if (!question) continue
                    const maxPoints = Number(question.points)
                    let score: number | null = null

                    if (question.options.type === "multiple_choice") {
                        const correct = new Set(question.options.correctIndices)
                        if (correct.size > 0) {
                            const studentCorrect = toSelectedIndices(cell.answer).filter((index) => correct.has(index)).length
                            score = (studentCorrect / correct.size) * maxPoints
                        }
                    } else if (question.options.type === "coding" && question.options.testCases.length > 0) {
                        const passed = cell.executionResult?.tests.filter((test) => test.passed).length ?? 0
                        score = (passed / question.options.testCases.length) * maxPoints
                    }

                    if (score !== null) {
                        grades.push({
                            attemptId: row.attemptId,
                            questionId: cell.questionId,
                            score: Math.round(Math.min(maxPoints, Math.max(0, score)) * 100) / 100,
                        })
                    }
                }
            }

            await Promise.all(grades.map((grade) => gradeAnswerRequest(
                courseId,
                examId,
                grade.attemptId,
                grade.questionId,
                { score: grade.score, gradedBy: graderId || "autograder" },
            )))
            return grades.length
        },
        onSuccess: async (count) => {
            await queryClient.invalidateQueries({ queryKey: ["exam-answer-table", courseId, examId] })
            await queryClient.invalidateQueries({ queryKey: ["exam-attempts", courseId, examId] })
            toast.success(`Autograded ${count} answer${count === 1 ? "" : "s"}.`)
        },
        onError: () => toast.error("Autograding failed. Some scores may have been saved; you can safely retry."),
    })

    const saveTableScore = useMutation({
        mutationFn: ({
            attemptId,
            questionId,
            score,
        }: {
            attemptId: string
            questionId: string
            score: number
        }) =>
            gradeAnswerRequest(courseId!, examId, attemptId, questionId, {
                score,
                gradedBy: graderId || "grader",
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["exam-answer-table", courseId, examId],
            })
        },
    })

    return (
        <div className="w-full px-6 py-8">
            <Stack gap={6}>
                <Group justify="between" align="center">
                    <Stack gap={1}>
                        <Heading level={1} size="lg">
                            Grading Portal
                        </Heading>
                        <Text size="sm" color="muted">
                            {exam
                                ? `${exam.title} (${attempts.length} attempts)`
                                : "Loading exam..."}
                        </Text>
                    </Stack>
                    <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                        Back to Exams
                    </Button>
                </Group>

                <Group gap={2}>
                    <Button
                        variant={view === "table" ? "default" : "outline"}
                        onClick={() => setView("table")}
                    >
                        Table view
                    </Button>
                    <Button
                        variant={view === "dictation" ? "default" : "outline"}
                        onClick={() => setView("dictation")}
                    >
                        Live dictation
                    </Button>
                </Group>

                {view === "table" || view === "dictation" ? (
                    <Stack gap={3} className="w-full">
                        <Group justify="between" align="end">
                            <Stack gap={1}>
                                <Heading level={2} size="md">
                                    Score table
                                </Heading>
                                <Text size="sm" color="muted">
                                    Edit points directly. Select a cell to preview the submitted answer.
                                </Text>
                            </Stack>
                            <Group gap={2} align="center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    disabled={!answerTable || autograde.isPending}
                                    onClick={() => autograde.mutate()}
                                >
                                    <Sparkles className="size-3.5" />
                                    {autograde.isPending ? "Autograding…" : "Autograde"}
                                </Button>
                                <Text size="xs" color="muted">
                                    Grading mode
                                </Text>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant={navigationMode === "free" ? "default" : "outline"}
                                                onClick={() => setNavigationMode("free")}
                                                className="gap-1.5"
                                            >
                                                <Move className="size-3.5" />
                                                Free
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            Arrow keys move freely. Enter moves down.
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant={navigationMode === "horizontal" ? "default" : "outline"}
                                                onClick={() => setNavigationMode("horizontal")}
                                                className="gap-1.5"
                                            >
                                                <MoveHorizontal className="size-3.5" />
                                                By student
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            Grade one student across questions. Enter moves right.
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant={navigationMode === "vertical" ? "default" : "outline"}
                                                onClick={() => setNavigationMode("vertical")}
                                                className="gap-1.5"
                                            >
                                                <MoveVertical className="size-3.5" />
                                                By question
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            Grade one question across students. Enter moves down.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Group>
                        </Group>

                        {answerTableLoading || !answerTable ? (
                            <Text size="sm" color="muted">
                                Loading table...
                            </Text>
                        ) : answerTable.rows.length === 0 ? (
                            <Text size="sm" color="muted">
                                No attempts yet.
                            </Text>
                        ) : (
                            <Group align="stretch" className="min-h-0 w-full gap-4">
                                <Box className="min-w-0 flex-1">
                                    <ExamGradingScoreTable
                                        answerTable={answerTable}
                                        questions={questions}
                                        selectedCell={selectedTableCell}
                                        navigationMode={navigationMode}
                                        dictatedScoreAction={dictatedScoreAction}
                                        onSelectCell={setSelectedTableCell}
                                        onSaveScore={async (attemptId, questionId, score) => {
                                            await saveTableScore.mutateAsync({
                                                attemptId,
                                                questionId,
                                                score,
                                            })
                                        }}
                                    />
                                </Box>
                                <Box className="w-1/2 shrink-0">
                                    {view === "dictation" ? (
                                        <GradingDictationPanel
                                            answerTable={answerTable}
                                            questions={questions}
                                            selectedCell={selectedTableCell}
                                            onSelectCell={setSelectedTableCell}
                                            onSaveScore={async (attemptId, questionId, score) => {
                                                setDictatedScoreAction({
                                                    attemptId,
                                                    questionId,
                                                    score,
                                                    nonce: Date.now(),
                                                })
                                                await saveTableScore.mutateAsync({
                                                    attemptId,
                                                    questionId,
                                                    score,
                                                })
                                            }}
                                        />
                                    ) : (
                                        <SelectedAnswerPreview selected={selectedTableCell} />
                                    )}
                                </Box>
                            </Group>
                        )}
                    </Stack>
                ) : null}

            </Stack>
        </div>
    )
}
