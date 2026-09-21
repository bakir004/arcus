import { Box, Group, Markdown, Stack, Text } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useTheme } from "@/hooks/use-theme"
import { ExamQuestionHeader } from "@/features/exams/portal/components/exam-question-header"
import { compileCodeRequest, executeCodeRequest, type ExecuteCodeInput } from "@/features/exams/portal/api/execute-code"
import { useExamContext } from "@/features/exams/portal/exam-context"
import {
    CodingLanguage,
    QuestionOptionType,
    type CodingLanguage as CodingLanguageType,
    type CodingOptions,
    type ExamQuestion,
} from "@/features/exams/types"
import { Code2, Copy, FileText, Loader2, Play, Terminal } from "lucide-react"
import * as React from "react"
import { CodeEditor } from "./code-editor"
import { codingLanguageMeta, SimpleIcon } from "./coding-language-meta"
import type { TestCase } from "../../types/coding-types"
import { internalEditorClipboard } from "../../lib/editor-clipboard"
import { HighlightedCode } from "./highlighted-code"
import { TestCaseCard } from "./test-case-card"

export type { CodingExample, TestCase } from "../../types/coding-types"

interface ExamCodingProps {
    number: number
    points: number
    title: string
    description: string
    testCases: TestCase[]
    language: CodingLanguageType
    starterCode: string
    initialCode: string
    flagged: boolean
    onEditorMount: (editor: import("monaco-editor").editor.IStandaloneCodeEditor) => void
    onCodeChange?: (code: string) => void
    onFlag: () => void
    onCompile: () => void
    onRunTests: () => void
    isCompiling?: boolean
    isRunningTests?: boolean
}

function ProblemStatementPanel({
    description,
    testCases,
    language,
}: {
    description: string
    testCases: TestCase[]
    language: CodingLanguageType
}) {
    const passed = testCases.filter((t) => t.status === "passed").length
    const ran = testCases.filter((t) => t.status !== undefined).length

    return (
        <ResizablePanel defaultSize={40} minSize={20}>
            <Tabs defaultValue="problem" className="flex h-full flex-col">
                <TabsList
                    variant="line"
                    className="h-10! w-full shrink-0 justify-start gap-0 rounded-none border-b px-4 py-0"
                >
                    <TabsTrigger value="problem" className="h-full gap-1.5 rounded-none px-3">
                        <FileText className="size-3.5" />
                        Problem
                    </TabsTrigger>
                    <TabsTrigger value="tests" className="h-full gap-1.5 rounded-none px-3">
                        <Terminal className="size-3.5" />
                        Test Cases
                        {ran > 0 && (
                            <Badge
                                variant={passed === ran ? "default" : "destructive"}
                                className="ml-1 text-xs"
                            >
                                {passed}/{ran}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="problem"
                    className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5"
                >
                    <Markdown>{description}</Markdown>
                </TabsContent>

                <TabsContent value="tests" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    <Stack gap={3}>
                        {testCases.map((tc) => (
                            <TestCaseCard key={tc.id} tc={tc} language={language === "javascript" ? "javascript" : language === "cpp" ? "cpp" : language === "java" ? "java" : language === "python" ? "python" : "sql"} />
                        ))}
                    </Stack>
                </TabsContent>
            </Tabs>
        </ResizablePanel>
    )
}

function InitialCodeDialog({ starterCode }: { starterCode: string }) {
    const code = starterCode

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    Initial code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Initial code</DialogTitle>
                    <DialogDescription>Starter code provided for this problem.</DialogDescription>
                </DialogHeader>
                <Group justify="end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                            internalEditorClipboard.current = code
                        }}
                    >
                        <Copy className="size-3.5" />
                        Copy to editor clipboard
                    </Button>
                </Group>
                <Box className="max-h-[65vh] overflow-auto scrollbar-thin">
                    <HighlightedCode code={code} />
                </Box>
            </DialogContent>
        </Dialog>
    )
}

function CodingActionButtons({
    onCompile,
    onRunTests,
    isCompiling,
    isRunningTests,
}: {
    onCompile: () => void
    onRunTests: () => void
    isCompiling: boolean
    isRunningTests: boolean
}) {
    const isOnline = useOnlineStatus()

    return (
        <Group gap={2}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Box as="span">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCompile}
                                disabled={!isOnline || isCompiling || isRunningTests}
                                className="gap-1.5"
                            >
                                {isCompiling ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Terminal className="size-3.5" />
                                )}
                                {isCompiling ? "Compiling..." : "Compile"}
                            </Button>
                        </Box>
                    </TooltipTrigger>
                    {!isOnline && (
                        <TooltipContent side="bottom">
                            You're offline — compilation requires a server connection.
                        </TooltipContent>
                    )}
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Box as="span">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onRunTests}
                                disabled={!isOnline || isCompiling || isRunningTests}
                                className="gap-1.5"
                            >
                                {isRunningTests ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Play className="size-3.5" />
                                )}
                                {isRunningTests ? "Running..." : "Run Tests"}
                            </Button>
                        </Box>
                    </TooltipTrigger>
                    {!isOnline && (
                        <TooltipContent side="bottom">
                            You're offline — tests run on the server.
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        </Group>
    )
}

function SolutionEditorPanel({
    language,
    starterCode,
    initialCode,
    onEditorMount,
    onCodeChange,
    onCompile,
    onRunTests,
    isCompiling,
    isRunningTests,
}: {
    language: CodingLanguageType
    starterCode: string
    initialCode: string
    onEditorMount: (editor: import("monaco-editor").editor.IStandaloneCodeEditor) => void
    onCodeChange?: (code: string) => void
    onCompile: () => void
    onRunTests: () => void
    isCompiling: boolean
    isRunningTests: boolean
}) {
    const { isDark } = useTheme()
    const languageMeta = codingLanguageMeta[language]
    const languageColor = isDark ? languageMeta.color.dark : languageMeta.color.light

    return (
        <ResizablePanel defaultSize={60} minSize={25}>
            <Stack className="h-full">
                <Group justify="between" align="center" className="h-10 shrink-0 border-b px-4">
                    <Group gap={2} align="center">
                        <Code2 className="text-muted-foreground size-4" />
                        <Text as="span" size="sm" weight="medium">
                            Solution
                        </Text>
                        <Badge
                            variant="outline"
                            className="gap-1.5"
                            style={{
                                color: languageColor,
                                borderColor: `${languageColor}66`,
                                backgroundColor: `${languageColor}1A`,
                            }}
                        >
                            <SimpleIcon icon={languageMeta.icon} className="size-3" />
                            {languageMeta.label}
                        </Badge>
                        <InitialCodeDialog starterCode={starterCode} />
                    </Group>
                    <CodingActionButtons
                        onCompile={onCompile}
                        onRunTests={onRunTests}
                        isCompiling={isCompiling}
                        isRunningTests={isRunningTests}
                    />
                </Group>
                <Box className="min-h-0 flex-1">
                    <CodeEditor
                        initialValue={initialCode}
                        onMount={onEditorMount}
                        onChange={onCodeChange}
                        language={language}
                    />
                </Box>
            </Stack>
        </ResizablePanel>
    )
}

const CODING_SAVE_DEBOUNCE = 1000

function renderTemplate(source: string, slots: Record<string, string>): string {
    return source.replace(/\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g, (_, key: string) => slots[key] ?? "")
}

function stdinSolution(studentCode: string): string {
    return `${studentCode}\n`
}

function studentCodePlaceholder(): string {
    return "// Your code goes here"
}

function nodeServerTest(professorCode: string, testCode: string): string {
    return `${professorCode}\n\n${testCode}\n`
}

function inferFunctionName(code: string): string | null {
    return code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/)?.[1] ?? null
}

function normalizeExpectedStdout(value?: string): string | undefined {
    if (value === undefined) return undefined
    try {
        return JSON.stringify(JSON.parse(value))
    } catch {
        return value
    }
}

function testCodeForCase(tc: CodingOptions["testCases"][number], studentCode: string): string {
    if (tc.code) return tc.code
    const functionName = inferFunctionName(studentCode)
    if (functionName && tc.input) return `console.log(JSON.stringify(${functionName}(${tc.input})))`
    return ""
}


function buildExecutionInput(questionId: string, opts: CodingOptions, studentCode: string): ExecuteCodeInput {
    return {
        questionId,
        mode: opts.mode ?? "js-stdin",
        studentCode,
        professorCode: opts.professorCode ?? "",
        studentCodeTemplate: opts.studentCodeTemplate,
        testCodeTemplate: opts.testCodeTemplate,
        templates: opts.templates,
        slots: opts.slots,
        tests: opts.testCases.map((tc, index) => ({
            id: tc.id ?? String(index),
            name: tc.name ?? `Test Case ${index + 1}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            code: testCodeForCase(tc, studentCode),
            expectedStdout: tc.expectedStdout ?? normalizeExpectedStdout(tc.expectedOutput),
            slots: tc.slots,
        })),
    }
}

function assembledForCase(opts: CodingOptions, studentCode: string, tc: CodingOptions["testCases"][number]) {
    const mode = opts.mode ?? "js-stdin"
    const testCode = testCodeForCase(tc, studentCode)
    const slots = {
        PROFESSOR_CODE: opts.professorCode ?? "",
        STUDENT_CODE: studentCode,
        TEST_CODE: testCode,
        ...(opts.slots ?? {}),
        ...(tc.slots ?? {}),
    }
    const renderedStudentCode = opts.studentCodeTemplate
        ? renderTemplate(opts.studentCodeTemplate, slots)
        : opts.templates?.studentCode
          ? renderTemplate(opts.templates.studentCode, slots)
          : studentCode
    const renderedTestCode = opts.testCodeTemplate
        ? renderTemplate(opts.testCodeTemplate, { ...slots, STUDENT_CODE: renderedStudentCode })
        : opts.templates?.testCode
          ? renderTemplate(opts.templates.testCode, { ...slots, STUDENT_CODE: renderedStudentCode })
          : testCode

    const displayStudentCode = studentCodePlaceholder()

    if (mode.includes("server")) {
        return {
            serverCode: displayStudentCode,
            testCode: nodeServerTest(opts.professorCode ?? "", renderedTestCode),
        }
    }
    return {
        assembledCode: stdinSolution(renderedStudentCode),
    }
}

function mapTestCases(testCases: CodingOptions["testCases"], opts: CodingOptions, studentCode: string): TestCase[] {
    return testCases.map((tc, i) => ({
        id: tc.id ?? String(i),
        label: tc.name ?? `Test Case ${i + 1}`,
        input: tc.input ?? "",
        expected: tc.expectedStdout ?? tc.expectedOutput ?? "",
        ...assembledForCase(opts, studentCode, tc),
    }))
}

export function ExamCoding({
    number,
    points,
    title,
    description,
    testCases,
    language,
    starterCode,
    initialCode,
    flagged,
    onEditorMount,
    onCodeChange,
    onFlag,
    onCompile,
    onRunTests,
    isCompiling = false,
    isRunningTests = false,
}: ExamCodingProps) {
    return (
        <Stack className="h-full">
            <ExamQuestionHeader
                number={number}
                points={points}
                title={title}
                prompt={description}
                typeLabel="Coding"
                flagged={flagged}
                onFlag={onFlag}
                flagVariant="ghost"
            />

            <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
                <ProblemStatementPanel description={description} testCases={testCases} language={language} />
                <ResizableHandle withHandle />
                <SolutionEditorPanel
                    language={language}
                    starterCode={starterCode}
                    initialCode={initialCode}
                    onEditorMount={onEditorMount}
                    onCodeChange={onCodeChange}
                    onCompile={onCompile}
                    onRunTests={onRunTests}
                    isCompiling={isCompiling}
                    isRunningTests={isRunningTests}
                />
            </ResizablePanelGroup>

        </Stack>
    )
}

export function CodingQuestion({
    questionId,
    question,
}: {
    questionId: string
    question: ExamQuestion
}) {
    const ctx = useExamContext()
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const saveAnswerRef = React.useRef(ctx.saveAnswer)
    const opts = question.options as CodingOptions
    const currentCode = ctx.codeAnswers.current[questionId] ?? opts.initialCode ?? "// Write your solution here\n"

    React.useEffect(() => {
        if (ctx.codeAnswers.current[questionId] === undefined) {
            ctx.codeAnswers.current[questionId] = opts.initialCode ?? ""
            if ((opts.initialCode ?? "").trim()) {
                ctx.saveAnswer(questionId, {
                    type: QuestionOptionType.Coding,
                    code: opts.initialCode ?? "",
                    language: opts.language ?? CodingLanguage.JavaScript,
                })
            }
        }
    }, [questionId, opts.initialCode, opts.language, ctx.codeAnswers, ctx.saveAnswer])

    const testCases = ctx.testResults[questionId] ?? mapTestCases(opts.testCases, opts, currentCode)
    const [isRunningTests, setIsRunningTests] = React.useState(false)
    const [isCompiling, setIsCompiling] = React.useState(false)

    React.useEffect(() => {
        saveAnswerRef.current = ctx.saveAnswer
    }, [ctx.saveAnswer])

    React.useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            const code = ctx.activeEditor.current?.getValue() ?? ctx.codeAnswers.current[questionId]
            if (!code?.trim()) return
            ctx.codeAnswers.current[questionId] = code
            saveAnswerRef.current(questionId, {
                type: QuestionOptionType.Coding,
                code,
                language: opts.language ?? CodingLanguage.JavaScript,
            })
        }
    }, [questionId, opts.language, ctx.activeEditor, ctx.codeAnswers])

    function handleCodeChange(code: string) {
        ctx.codeAnswers.current[questionId] = code
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            ctx.saveAnswer(questionId, {
                type: QuestionOptionType.Coding,
                code,
                language: opts.language ?? CodingLanguage.JavaScript,
            })
        }, CODING_SAVE_DEBOUNCE)
    }

    async function handleCompile() {
        const code = ctx.activeEditor.current?.getValue() ?? ctx.codeAnswers.current[questionId] ?? ""
        if (!code.trim() || isCompiling) return
        const pendingTests = mapTestCases(opts.testCases, opts, code).map((tc) => ({
            ...tc,
            status: "pending" as const,
        }))
        ctx.setTestResults(questionId, pendingTests)
        setIsCompiling(true)
        try {
            const result = await compileCodeRequest(
                { courseId: ctx.exam.courseId, examId: ctx.exam.id, attemptId: ctx.attemptId, questionId },
                buildExecutionInput(questionId, opts, code),
            )
            ctx.setTestResults(
                questionId,
                mapTestCases(opts.testCases, opts, code).map((tc) => ({
                    ...tc,
                    actual: result.compile.passed
                        ? "Compilation passed"
                        : result.compile.timedOut
                          ? "Timed out"
                          : result.compile.stderr || result.compile.stdout || result.compile.error || "Compilation failed",
                    status: result.compile.passed ? "passed" : "failed",
                })),
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not compile."
            ctx.setTestResults(
                questionId,
                mapTestCases(opts.testCases, opts, code).map((tc) => ({ ...tc, actual: message, status: "failed" })),
            )
        } finally {
            setIsCompiling(false)
        }
    }

    async function handleRunTests() {
        const code = ctx.activeEditor.current?.getValue() ?? ctx.codeAnswers.current[questionId] ?? ""
        if (!code.trim() || isRunningTests) return

        const pendingTests = mapTestCases(opts.testCases, opts, code).map((tc) => ({
            ...tc,
            status: "pending" as const,
        }))
        ctx.setTestResults(questionId, pendingTests)
        setIsRunningTests(true)

        try {
            const result = await executeCodeRequest(
                { courseId: ctx.exam.courseId, examId: ctx.exam.id, attemptId: ctx.attemptId, questionId },
                buildExecutionInput(questionId, opts, code),
            )

            ctx.setTestResults(
                questionId,
                mapTestCases(opts.testCases, opts, code).map((tc, index) => {
                    const testResult = result.tests.find((item) => item.id === tc.id) ?? result.tests[index]
                    if (!result.compile.passed) {
                        return {
                            ...tc,
                            actual: result.compile.timedOut
                                ? "Timed out"
                                : result.compile.stderr || result.compile.stdout || result.compile.error || "Compilation failed",
                            status: "failed",
                        }
                    }
                    return {
                        ...tc,
                        actual: testResult
                            ? testResult.stdout || testResult.stderr || testResult.error || "No output"
                            : "No output",
                        status: testResult?.passed ? "passed" : "failed",
                    }
                }),
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not run tests."
            ctx.setTestResults(
                questionId,
                mapTestCases(opts.testCases, opts, code).map((tc) => ({
                    ...tc,
                    actual: message,
                    status: "failed",
                })),
            )
        } finally {
            setIsRunningTests(false)
        }
    }

    return (
        <ExamCoding
            key={questionId}
            number={question.position}
            points={Number.parseFloat(question.points)}
            title={question.prompt
                .split("\n")[0]
                .replace(/[*_`#>]/g, "")
                .trim()}
            description={question.prompt}
            language={opts.language ?? CodingLanguage.JavaScript}
            starterCode={opts.initialCode ?? ""}
            initialCode={currentCode}
            testCases={testCases}
            flagged={ctx.flagged[questionId] ?? false}
            onEditorMount={(editor) => {
                ctx.activeEditor.current = editor
            }}
            onCodeChange={handleCodeChange}
            onFlag={() => ctx.toggleFlagged(questionId)}
            isCompiling={isCompiling}
            isRunningTests={isRunningTests}
            onCompile={handleCompile}
            onRunTests={handleRunTests}
        />
    )
}
