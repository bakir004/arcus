import * as React from "react"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { CalendarDays, Check, ChevronLeft, ChevronRight, GraduationCap, GripVertical, Loader2, Plus, Trash2 } from "lucide-react"
import { Box, Group, Heading, Panel, Stack, Text } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DebouncedMonacoEditor } from "@/features/exams/coding/components/debounced-monaco-editor"
import { QuestionPromptEditor } from "@/features/exams/coding/components/question-prompt-editor"
import {
    createQuestionRequest,
    createExamItemRequest,
    createTimeslotRequest,
    deleteQuestionRequest,
    deleteTimeslotRequest,
    getExamBuilderRequest,
    reorderQuestionsRequest,
    updateExamRequest,
    updateExamItemRequest,
    updateQuestionRequest,
    updateTimeslotRequest,
    type ExamPatch,
    type QuestionCreate,
} from "@/features/exams/coding/api/exam-builder"
import {
    CodingLanguage,
    ExamVisibility,
    QuestionOptionType,
    type CodingOptions,
    type Exam,
    type ExamQuestion,
    type ExamTimeslot,
    type MultipleChoiceOptions,
    type QuestionOptions,
} from "@/features/exams/types"

type EditableQuestion = Omit<ExamQuestion, "points"> & { points: number }
type SaveState = "idle" | "saving" | "saved" | "error"

const modesByLanguage: Record<CodingLanguage, { value: string; label: string }[]> = {
    [CodingLanguage.JavaScript]: [
        { value: "js-stdin", label: "Stdin" },
        { value: "js-server", label: "HTTP server" },
        { value: "js-server-mysql", label: "HTTP server + MySQL" },
    ],
    [CodingLanguage.Java]: [
        { value: "java-stdin", label: "Stdin" },
        { value: "java-server", label: "HTTP server" },
        { value: "java-server-mysql", label: "HTTP server + MySQL" },
    ],
    [CodingLanguage.Cpp]: [{ value: "cpp-stdin", label: "Stdin" }],
    [CodingLanguage.Python]: [{ value: "python-stdin", label: "Stdin" }],
    [CodingLanguage.Sql]: [{ value: "sql-stdin", label: "Stdin" }],
}

const runtimeLanguageSections = [
    { language: CodingLanguage.JavaScript, label: "JavaScript" },
    { language: CodingLanguage.Java, label: "Java" },
    { language: CodingLanguage.Cpp, label: "C++" },
    { language: CodingLanguage.Python, label: "Python" },
    { language: CodingLanguage.Sql, label: "SQL" },
]

const codingDefaults: CodingOptions = {
    type: QuestionOptionType.Coding,
    language: CodingLanguage.JavaScript,
    mode: "js-stdin",
    initialCode: "return a + b",
    professorCode: "",
    studentCodeTemplate: "function add(a, b) {\n  {{ STUDENT_CODE }}\n}\n",
    testCodeTemplate: "{{ TEST_CODE }}",
    slots: {},
    testCases: [
        { name: "adds positive numbers", code: "console.log(add(2, 3))", expectedStdout: "5" },
    ],
}

function defaultOptions(type: "mcq" | "essay" | "coding"): QuestionOptions {
    if (type === "mcq")
        return {
            type: QuestionOptionType.MultipleChoice,
            choices: ["Option 1", "Option 2"],
            correctIndices: [0],
        }
    if (type === "coding") return structuredClone(codingDefaults)
    return { type: QuestionOptionType.Essay }
}

function questionLabel(question: EditableQuestion): string {
    if (question.options.type === QuestionOptionType.MultipleChoice) return "MCQ"
    if (question.options.type === QuestionOptionType.Coding) return "Coding"
    return "Essay"
}

function SortableQuestionRow({
    question,
    index,
    selected,
    disabled,
    onSelect,
    onPointsChange,
}: {
    question: EditableQuestion
    index: number
    selected: boolean
    disabled: boolean
    onSelect: () => void
    onPointsChange: (points: number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id,
        disabled,
    })
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={`flex items-center rounded-md ${selected ? "bg-accent" : "hover:bg-muted"} ${isDragging ? "relative z-10 opacity-70" : ""}`}
        >
            <button
                type="button"
                className="ml-1 grid size-7 shrink-0 cursor-grab place-items-center rounded text-muted-foreground active:cursor-grabbing"
                aria-label={`Reorder question ${index + 1}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>
            <button type="button" onClick={onSelect} className="min-w-0 flex-1 px-2 py-2 text-left">
                <Text weight="medium">Question {index + 1}</Text>
                <Text size="sm" tone="muted">{questionLabel(question)}</Text>
            </button>
            <div className="mr-2 flex items-center gap-1" title="Question points">
                <Input type="number" min={0.01} max={100} step={0.5} value={question.points} onClick={(event) => event.stopPropagation()} onChange={(event) => { const points = Number(event.target.value); if (points >= 0.01 && points <= 100) onPointsChange(points) }} className="h-8 w-14" aria-label={`Points for question ${index + 1}`} />
                <Text size="xs" tone="muted">pts</Text>
            </div>
        </div>
    )
}

function validQuestion(question: EditableQuestion): boolean {
    if (!question.prompt.trim() || question.points < 0.01 || question.points > 100) return false
    if (question.options.type === QuestionOptionType.Coding) {
        const { mode = "js-stdin", studentCodeTemplate, templates, testCases = [] } = question.options
        const template = studentCodeTemplate ?? templates?.studentCode ?? ""
        const names = testCases.map((test) => test.name?.trim()).filter(Boolean)
        return (
            template.includes("{{ STUDENT_CODE }}") || template.includes("{{STUDENT_CODE}}")
        ) && testCases.length > 0 && names.length === testCases.length && new Set(names).size === names.length &&
            testCases.every((test) => test.expectedStdout !== undefined || test.expectedOutput !== undefined) &&
            (!mode.includes("server") || Boolean(question.options.testCodeTemplate ?? templates?.testCode))
    }
    if (question.options.type !== QuestionOptionType.MultipleChoice) return true
    const { choices, correctIndices } = question.options
    const normalized = choices.map((choice) => choice.trim())
    return (
        choices.length >= 2 &&
        choices.length <= 20 &&
        normalized.every(Boolean) &&
        new Set(normalized).size === choices.length &&
        correctIndices.length > 0 &&
        correctIndices.every((index) => index >= 0 && index < choices.length)
    )
}

export function ExamBuilderPage({ courseId, courseCode, examId }: { courseId: string; courseCode: string; examId: string }) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
    const queryKey = ["courses", courseId, "exams", examId, "builder"] as const
    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => getExamBuilderRequest(courseId, examId),
        refetchOnWindowFocus: false,
    })
    const [exam, setExam] = React.useState<Exam | null>(null)
    const [questions, setQuestions] = React.useState<EditableQuestion[]>([])
    const [items, setItems] = React.useState<NonNullable<typeof data>["items"]>([])
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [saveState, setSaveState] = React.useState<SaveState>("idle")
    const [saveError, setSaveError] = React.useState("")
    const [adding, setAdding] = React.useState(false)
    const hydratedExamId = React.useRef<string | null>(null)
    const timers = React.useRef(new Map<string, number>())
    const pendingOperations = React.useRef(new Map<string, () => Promise<unknown>>())
    const queues = React.useRef(new Map<string, Promise<unknown>>())
    const pendingExamPatch = React.useRef<ExamPatch>({})

    React.useEffect(() => {
        if (!data || hydratedExamId.current === examId) return
        hydratedExamId.current = examId
        setExam(data.exam)
        const editable = data.questions.map((question) => ({
            ...question,
            points: Number(question.points),
        }))
        setQuestions(editable)
        setItems(data.items)
        setSelectedId(editable[0]?.id ?? null)
    }, [data, examId])

    React.useEffect(
        () => () => {
            timers.current.forEach((timer) => {
                window.clearTimeout(timer)
            })
            pendingOperations.current.forEach((operation, key) => {
                const previous = queues.current.get(key) ?? Promise.resolve()
                void previous
                    .catch(() => undefined)
                    .then(operation)
                    .catch(() => undefined)
            })
        },
        [],
    )

    const enqueue = React.useCallback((key: string, operation: () => Promise<unknown>) => {
        setSaveState("saving")
        setSaveError("")
        const previous = queues.current.get(key) ?? Promise.resolve()
        const next = previous.catch(() => undefined).then(operation)
        queues.current.set(key, next)
        next.then(() => {
            if (queues.current.get(key) === next) {
                setSaveState("saved")
                window.setTimeout(
                    () => setSaveState((state) => (state === "saved" ? "idle" : state)),
                    1500,
                )
            }
        }).catch((reason) => {
            setSaveState("error")
            setSaveError(reason?.message ?? "Could not save changes")
        })
    }, [])

    const debounce = React.useCallback(
        (key: string, operation: () => Promise<unknown>) => {
            const old = timers.current.get(key)
            if (old !== undefined) window.clearTimeout(old)
            pendingOperations.current.set(key, operation)
            timers.current.set(
                key,
                window.setTimeout(() => {
                    timers.current.delete(key)
                    pendingOperations.current.delete(key)
                    enqueue(key, operation)
                }, 650),
            )
        },
        [enqueue],
    )

    function patchExam(patch: ExamPatch) {
        if (!exam) return
        const titleChanged = patch.title !== undefined
        const autogeneratedSlug = exam.slug === slugify(exam.title) || (exam.title === "Untitled exam" && exam.slug.startsWith("untitled-exam-"))
        const next = {
            ...exam,
            ...patch,
            ...(titleChanged && autogeneratedSlug && patch.title
                ? { slug: slugify(patch.title) }
                : {}),
        }
        if (titleChanged && autogeneratedSlug && patch.title) {
            patch = { ...patch, slug: slugify(patch.title) }
        }
        setExam(next)
        pendingExamPatch.current = { ...pendingExamPatch.current, ...patch }
        if (!next.title.trim()) {
            setSaveState("error")
            setSaveError("Exam title cannot be empty.")
            return
        }
        debounce("exam", async () => {
            const payload = pendingExamPatch.current
            pendingExamPatch.current = {}
            const saved = await updateExamRequest(courseId, examId, payload)
            queryClient.setQueryData(queryKey, (current: typeof data) =>
                current ? { ...current, exam: saved } : current,
            )
            if (saved.slug !== examId) {
                await navigate({
                    to: "/courses/$code/exams/$examId/edit",
                    params: { code: courseCode, examId: saved.slug },
                    replace: true,
                })
            }
        })
    }

    function replaceQuestion(next: EditableQuestion) {
        setQuestions((current) =>
            current.map((question) => (question.id === next.id ? next : question)),
        )
        if (!validQuestion(next)) {
            setSaveState("error")
            setSaveError(
                "Complete the prompt and points. Coding questions also need a {{ STUDENT_CODE }} template and uniquely named tests with expected output.",
            )
            return
        }
        debounce(`question:${next.id}`, async () => {
            const saved = await updateQuestionRequest(courseId, examId, next.id, {
                prompt: next.prompt,
                points: next.points,
                options: next.options,
            })
            queryClient.setQueryData(queryKey, (current: typeof data) =>
                current
                    ? {
                          ...current,
                          questions: current.questions.map((question) =>
                              question.id === saved.id ? saved : question,
                          ),
                      }
                    : current,
            )
        })
    }

    async function addItem() {
        setAdding(true)
        try {
            const item = await createExamItemRequest(courseId, examId, {
                position: Math.max(0, ...items.map((entry) => entry.position)) + 1,
                maxPoints: 1,
                label: `Problem ${items.length + 1}`,
            })
            setItems((current) => [...current, item])
            setSaveState("saved")
        } catch (reason) {
            setSaveState("error")
            setSaveError(errorMessage(reason, "Could not create problem"))
        } finally { setAdding(false) }
    }

    async function updateItemPrompt(itemId: string, prompt: string) {
        setItems((current) => current.map((item) => item.id === itemId ? { ...item, prompt: prompt || null } : item))
        try { await updateExamItemRequest(courseId, examId, itemId, { prompt: prompt || null }) }
        catch (reason) { setSaveState("error"); setSaveError(errorMessage(reason, "Could not save problem statement")) }
    }

    async function addQuestion(type: "mcq" | "essay" | "coding") {
        setAdding(true)
        setSaveState("saving")
        try {
            const input: QuestionCreate = {
                prompt: "Untitled question",
                position: Math.max(0, ...questions.map((question) => question.position)) + 1,
                points: 1,
                options: defaultOptions(type),
            }
            const saved = await createQuestionRequest(courseId, examId, input)
            const editable = { ...saved, points: Number(saved.points) }
            setQuestions((current) => [...current, editable])
            setSelectedId(saved.id)
            setSaveState("saved")
            await queryClient.invalidateQueries({ queryKey: ["courses", courseId, "exams"] })
        } catch (reason: unknown) {
            setSaveState("error")
            setSaveError(errorMessage(reason, "Could not create question"))
        } finally {
            setAdding(false)
        }
    }

    async function persistQuestionOrder(reordered: EditableQuestion[]) {
        const previous = questions
        const positioned = reordered.map((question, questionIndex) => ({
            ...question,
            position: questionIndex + 1,
        }))
        setQuestions(positioned)
        setSaveState("saving")
        try {
            const saved = await reorderQuestionsRequest(
                courseId,
                examId,
                positioned.map((question) => question.id),
            )
            const editable = saved.map((question) => ({ ...question, points: Number(question.points) }))
            setQuestions(editable)
            queryClient.setQueryData(queryKey, (current: typeof data) =>
                current ? { ...current, questions: saved } : current,
            )
            setSaveState("saved")
        } catch (reason: unknown) {
            setQuestions(previous)
            setSaveState("error")
            setSaveError(errorMessage(reason, "Could not reorder questions"))
        }
    }

    function handleQuestionDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id || saveState === "saving") return
        const oldIndex = questions.findIndex((question) => question.id === active.id)
        const newIndex = questions.findIndex((question) => question.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        void persistQuestionOrder(arrayMove(questions, oldIndex, newIndex))
    }

    async function publishExam() {
        const timer = timers.current.get("exam")
        if (timer !== undefined) window.clearTimeout(timer)
        timers.current.delete("exam")
        pendingOperations.current.delete("exam")
        const patch = { ...pendingExamPatch.current, visibility: ExamVisibility.Published }
        pendingExamPatch.current = {}
        setSaveState("saving")
        setSaveError("")
        try {
            await queues.current.get("exam")?.catch(() => undefined)
            const saved = await updateExamRequest(courseId, examId, patch)
            setExam((current) => current ? { ...current, ...saved } : saved)
            queryClient.setQueryData(queryKey, (current: typeof data) =>
                current ? { ...current, exam: { ...saved, timeslots: current.exam.timeslots } } : current,
            )
            await queryClient.invalidateQueries({ queryKey: ["courses", courseId, "exams"] })
            setSaveState("saved")
        } catch (reason: unknown) {
            setSaveState("error")
            setSaveError(errorMessage(reason, "Could not publish exam"))
        }
    }

    async function removeQuestion(question: EditableQuestion) {
        const timer = timers.current.get(`question:${question.id}`)
        if (timer !== undefined) window.clearTimeout(timer)
        pendingOperations.current.delete(`question:${question.id}`)
        setSaveState("saving")
        try {
            await queues.current.get(`question:${question.id}`)?.catch(() => undefined)
            await deleteQuestionRequest(courseId, examId, question.id)
            const remaining = questions.filter((entry) => entry.id !== question.id)
            setQuestions(remaining)
            setSelectedId(remaining[0]?.id ?? null)
            setSaveState("saved")
        } catch (reason: unknown) {
            setSaveState("error")
            setSaveError(errorMessage(reason, "Could not delete question"))
        }
    }

    if (error) return <main className="space-y-2 p-8 text-destructive"><h1 className="text-lg font-semibold">Could not load the exam builder.</h1><p>{error instanceof Error ? error.message : JSON.stringify(error)}</p></main>
    if (isLoading || !exam)
        return (
            <main className="grid min-h-[70vh] place-items-center">
                <Loader2 className="size-7 animate-spin" />
            </main>
        )

    const selected = questions.find((question) => question.id === selectedId) ?? null

    return (
        <main className="w-full space-y-6 px-4 py-8">
            <Group justify="between" align="start" gap={4}>
                <Box>
                    <Heading level={1} size="xl">
                        Exam builder
                    </Heading>
                    <Text tone="muted">Changes are saved automatically as a draft.</Text>
                </Box>
                <Group gap={2}>
                    <Button asChild type="button" variant="outline">
                        <Link to="/grading/exams/$examId" params={{ examId }}>
                            <GraduationCap className="mr-2 size-4" />
                            Open grading
                        </Link>
                    </Button>
                    {exam.visibility === ExamVisibility.Draft ? (
                        <Button type="button" disabled={saveState === "saving"} onClick={() => void publishExam()}>
                            Publish exam
                        </Button>
                    ) : null}
                    <Badge variant="secondary">
                        {exam.visibility === ExamVisibility.Draft ? "Draft" : exam.visibility}
                    </Badge>
                    <Badge variant={saveState === "error" ? "destructive" : "outline"}>
                        {saveState === "saving" ? (
                            "Saving…"
                        ) : saveState === "saved" ? (
                            <>
                                <Check className="mr-1 size-3" />
                                Saved
                            </>
                        ) : saveState === "error" ? (
                            "Save failed"
                        ) : (
                            "All changes saved"
                        )}
                    </Badge>
                </Group>
            </Group>
            {saveError ? <Text className="text-destructive">{saveError}</Text> : null}

            <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-1">
                <Heading level={2} size="md">
                    Exam details
                </Heading>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="md:col-span-2 lg:col-span-3"><Field label="Title">
                        <Input
                            value={exam.title}
                            onChange={(event) => patchExam({ title: event.target.value })}
                        />
                    </Field></div>
                    <Field label="Slug">
                        <Input
                            value={exam.slug}
                            onChange={(event) => patchExam({ slug: slugify(event.target.value) })}
                            aria-label="Exam URL slug"
                        />
                    </Field>
                    <Field label="Duration (minutes)">
                        <Input
                            type="number"
                            min={1}
                            max={1440}
                            value={exam.durationMinutes}
                            onChange={(event) => {
                                const value = Number(event.target.value)
                                if (value >= 1 && value <= 1440)
                                    patchExam({ durationMinutes: value })
                            }}
                        />
                    </Field>
                    <Field label="Maximum attempts">
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={exam.maxAttempts}
                            onChange={(event) => {
                                const value = Number(event.target.value)
                                if (value >= 1 && value <= 20) patchExam({ maxAttempts: value })
                            }}
                        />
                    </Field>
                    <div className="md:col-span-2 lg:col-span-3">
                        <Field label="Description">
                            <Textarea
                                value={exam.description ?? ""}
                                onChange={(event) =>
                                    patchExam({ description: event.target.value || null })
                                }
                            />
                        </Field>
                    </div>
                </div>
            </Panel>

            <div className="lg:col-span-2">
            <TimeslotsEditor
                timeslots={exam.timeslots ?? []}
                onCreate={async () => {
                    setSaveState("saving")
                    try {
                        const slot = await createTimeslotRequest(courseId, examId, {
                            location: "A-101",
                            startsAt: new Date(Date.now() + 86400000).toISOString(),
                            capacity: 30,
                        })
                        setExam((current) => current ? { ...current, timeslots: [...(current.timeslots ?? []), slot] } : current)
                        setSaveState("saved")
                    } catch (reason) { setSaveState("error"); setSaveError(errorMessage(reason, "Could not create timeslot")) }
                }}
                onChange={async (slot, patch) => {
                    setExam((current) => current ? { ...current, timeslots: (current.timeslots ?? []).map((item) => item.id === slot.id ? { ...item, ...patch } : item) } : current)
                    debounce(`timeslot:${slot.id}`, async () => {
                        const saved = await updateTimeslotRequest(courseId, examId, slot.id, patch)
                        setExam((current) => current ? { ...current, timeslots: (current.timeslots ?? []).map((item) => item.id === saved.id ? saved : item) } : current)
                    })
                }}
                onDelete={async (slot) => {
                    setSaveState("saving")
                    try { await deleteTimeslotRequest(courseId, examId, slot.id); setExam((current) => current ? { ...current, timeslots: (current.timeslots ?? []).filter((item) => item.id !== slot.id) } : current); setSaveState("saved") }
                    catch (reason) { setSaveState("error"); setSaveError(errorMessage(reason, "Could not delete timeslot")) }
                }}
            />
            </div>
            </div>

            <Panel className="p-5">
                <Group justify="between"><Box><Heading level={2} size="md">Problems</Heading><Text tone="muted">Gradeable exam items can exist without a question. Statements are available for online exams.</Text></Box><Button size="sm" variant="outline" disabled={adding} onClick={() => void addItem()}><Plus className="mr-1 size-3" />Add problem</Button></Group>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <div key={item.id} className="rounded-md border p-3"><Text weight="medium">{item.label || `Problem ${item.position}`}</Text><Text size="sm" tone="muted">{item.maxPoints} pts</Text>{exam.type === "online" ? <Textarea className="mt-2 min-h-20 text-sm" placeholder="Optional problem statement" defaultValue={item.prompt ?? ""} onBlur={(event) => void updateItemPrompt(item.id, event.target.value)} /> : null}</div>)}{!items.length ? <Text tone="muted">No problems yet.</Text> : null}</div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
                <Panel className="h-fit p-4">
                    <Group gap={2} className="mb-4">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={adding}
                            onClick={() => addQuestion("mcq")}
                        >
                            <Plus className="mr-1 size-3" />
                            MCQ
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={adding}
                            onClick={() => addQuestion("essay")}
                        >
                            <Plus className="mr-1 size-3" />
                            Essay
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={adding}
                            onClick={() => addQuestion("coding")}
                        >
                            <Plus className="mr-1 size-3" />
                            Coding
                        </Button>
                    </Group>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
                        <SortableContext items={questions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
                            <Stack gap={2}>
                                {questions.map((question, index) => (
                                    <SortableQuestionRow
                                        key={question.id}
                                        question={question}
                                        index={index}
                                        selected={selectedId === question.id}
                                        disabled={saveState === "saving"}
                                        onSelect={() => setSelectedId(question.id)}
                                        onPointsChange={(points) => replaceQuestion({ ...question, points })}
                                    />
                                ))}
                                {!questions.length ? <Text tone="muted">No questions yet.</Text> : null}
                            </Stack>
                        </SortableContext>
                    </DndContext>
                </Panel>

                {selected ? (
                    <QuestionEditor
                        question={selected}
                        onChange={replaceQuestion}
                        onDelete={() => removeQuestion(selected)}
                    />
                ) : (
                    <Panel className="grid min-h-72 place-items-center">
                        <Text tone="muted">Create or select a question.</Text>
                    </Panel>
                )}
            </div>
        </main>
    )
}

function QuestionEditor({
    question,
    onChange,
    onDelete,
}: {
    question: EditableQuestion
    onChange: (question: EditableQuestion) => void
    onDelete: () => void
}) {
    const updateOptions = (options: QuestionOptions) => onChange({ ...question, options })
    return (
        <Stack gap={4}>
            <Panel className="p-5">
                <Group justify="between" align="end" gap={4}>
                    <div className="flex-1">
                        <Field label="Question prompt">
                            <QuestionPromptEditor
                                key={question.id}
                                value={question.prompt}
                                onChange={(prompt) => onChange({ ...question, prompt })}
                            />
                        </Field>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onDelete}
                        aria-label="Delete question"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </Group>
            </Panel>
            {question.options.type === QuestionOptionType.MultipleChoice ? (
                <McqEditor options={question.options} onChange={updateOptions} />
            ) : question.options.type === QuestionOptionType.Coding ? (
                <CodingEditor options={question.options} onChange={updateOptions} />
            ) : (
                <Panel className="p-5">
                    <Heading level={2} size="md">
                        Essay answer
                    </Heading>
                    <Text tone="muted" className="mt-2">
                        Students will provide a free-form response. Put all grading context in the
                        question prompt.
                    </Text>
                </Panel>
            )}
        </Stack>
    )
}

function McqEditor({
    options,
    onChange,
}: {
    options: MultipleChoiceOptions
    onChange: (options: MultipleChoiceOptions) => void
}) {
    function remove(index: number) {
        if (options.choices.length <= 2) return
        const choices = options.choices.filter((_, item) => item !== index)
        let correctIndices = options.correctIndices
            .filter((item) => item !== index)
            .map((item) => (item > index ? item - 1 : item))
        if (!correctIndices.length) correctIndices = [0]
        onChange({ ...options, choices, correctIndices })
    }
    return (
        <Panel className="p-5">
            <Group justify="between">
                <Box>
                    <Heading level={2} size="md">
                        Choices
                    </Heading>
                    <Text tone="muted">Select every correct answer.</Text>
                </Box>
                <Button
                    variant="outline"
                    disabled={options.choices.length >= 20}
                    onClick={() =>
                        onChange({
                            ...options,
                            choices: [...options.choices, `Option ${options.choices.length + 1}`],
                        })
                    }
                >
                    <Plus className="mr-2 size-4" />
                    Add option
                </Button>
            </Group>
            <Stack gap={3} className="mt-4">
                {options.choices.map((choice, index) => (
                    <Group key={index} gap={3}>
                        <Checkbox
                            checked={options.correctIndices.includes(index)}
                            onCheckedChange={(checked) => {
                                let correctIndices = checked
                                    ? [...options.correctIndices, index]
                                    : options.correctIndices.filter((item) => item !== index)
                                if (!correctIndices.length) correctIndices = [index]
                                onChange({ ...options, correctIndices })
                            }}
                        />
                        <Input
                            value={choice}
                            onChange={(event) =>
                                onChange({
                                    ...options,
                                    choices: options.choices.map((item, itemIndex) =>
                                        itemIndex === index ? event.target.value : item,
                                    ),
                                })
                            }
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={options.choices.length <= 2}
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </Group>
                ))}
            </Stack>
        </Panel>
    )
}

function CodingEditor({ options, onChange }: { options: CodingOptions; onChange: (options: CodingOptions) => void }) {
    const patch = (value: Partial<CodingOptions>) => onChange({ ...options, ...value })
    const tests = options.testCases ?? []
    const [selectedTest, setSelectedTest] = React.useState(0)
    const mode = options.mode ?? modesByLanguage[options.language][0].value
    const isStdinMode = mode.endsWith("-stdin")
    const isServerMode = mode.includes("-server")
    const stdinFile = options.studentCodeTemplate ?? options.templates?.studentCode ?? [options.professorCode, options.testCodeTemplate]
        .filter((section) => section?.trim())
        .join("\n\n")
    const activeTest = tests[selectedTest]

    React.useEffect(() => {
        if (selectedTest >= tests.length) setSelectedTest(Math.max(0, tests.length - 1))
    }, [selectedTest, tests.length])

    return (
        <Stack gap={4}>
            <Panel className="p-0">
                <Group justify="between" align="start" className="border-b px-5 py-4">
                    <Box>
                        <Heading level={2} size="md">{isStdinMode ? "Single stdin problem file" : "Professor wrapper and templates"}</Heading>
                        <Text tone="muted" size="sm">{isStdinMode ? "Edit the complete generated file and the initial code shown to students." : "The server file and request harness are hidden from students."}</Text>
                    </Box>
                    <div className="w-60">
                        <Field label="Runtime">
                            <Select value={mode} onValueChange={(nextMode) => {
                                const section = runtimeLanguageSections.find(({ language }) => modesByLanguage[language].some(({ value }) => value === nextMode))
                                if (section) patch({ mode: nextMode, language: section.language })
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {runtimeLanguageSections.map((section) => (
                                        <SelectGroup key={section.language}>
                                            <SelectLabel>{section.label}</SelectLabel>
                                            {modesByLanguage[section.language].map((item) => <SelectItem key={item.value} value={item.value}>{section.label} · {item.label}</SelectItem>)}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                </Group>
                {isStdinMode ? (
                    <div className="grid gap-4 p-5 lg:grid-cols-[3fr_2fr]">
                        <CodeField label="Complete stdin template file" language={options.language} value={stdinFile} onChange={(studentCodeTemplate) => patch({ studentCodeTemplate, templates: { ...options.templates, studentCode: studentCodeTemplate } })} rows={31} />
                        <CodeField label="Student initial code" language={options.language} value={options.initialCode ?? ""} onChange={(initialCode) => patch({ initialCode })} rows={9} />
                    </div>
                ) : isServerMode ? (
                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                        <CodeField label="Complete student server file" language={options.language} value={options.studentCodeTemplate ?? ""} onChange={(studentCodeTemplate) => patch({ studentCodeTemplate })} rows={23} />
                        <CodeField label="Initial student code" language={options.language} value={options.initialCode ?? ""} onChange={(initialCode) => patch({ initialCode })} rows={23} />
                        <div className="lg:col-span-2">
                            <CodeField label="JavaScript request test harness" language={CodingLanguage.JavaScript} value={options.testCodeTemplate ?? ""} onChange={(testCodeTemplate) => patch({ testCodeTemplate })} rows={15} />
                            <Text tone="muted" size="sm" className="mt-2">Use {"{{ TEST_CODE }}"} where per-test request/output code should be injected.</Text>
                        </div>
                    </div>
                ) : null}
            </Panel>

            <Panel className="p-0">
                <Group justify="between" className="border-b px-5 py-4">
                    <Box><Heading level={2} size="md">Test cases</Heading><Text tone="muted" size="sm">Select a test, then edit its code, stdin, and expected output.</Text></Box>
                    <Button variant="outline" disabled={tests.length >= 50} onClick={() => {
                        const next = [...tests, { name: `Test ${tests.length + 1}`, input: "", code: printDefault(options.language), expectedStdout: "expected output" }]
                        patch({ testCases: next }); setSelectedTest(next.length - 1)
                    }}><Plus className="mr-2 size-4" />Add test</Button>
                </Group>
                <div className="grid gap-4 p-5 lg:grid-cols-[16rem_1fr]">
                    <div className="space-y-2 rounded-lg border p-2">
                        <Label className="px-2">Test list</Label>
                        {tests.map((test, index) => <button key={index} type="button" className={`w-full rounded-md px-3 py-2 text-left text-sm ${selectedTest === index ? "bg-accent" : "hover:bg-muted"}`} onClick={() => setSelectedTest(index)}><span className="font-medium">{test.name || `Test ${index + 1}`}</span></button>)}
                        {!tests.length ? <Text tone="muted" className="px-2 py-6 text-center">No automatic tests.</Text> : null}
                    </div>
                    {activeTest ? <div className="space-y-4">
                        <Group align="end" gap={3}><div className="flex-1"><Field label="Name"><Input value={activeTest.name ?? ""} onChange={(event) => patch({ testCases: tests.map((test, index) => index === selectedTest ? { ...test, name: event.target.value } : test) })} /></Field></div><Button variant="destructive" onClick={() => patch({ testCases: tests.filter((_, index) => index !== selectedTest) })}>Remove</Button></Group>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <CodeField label={`Test code (${options.language})`} language={options.language} value={activeTest.code ?? ""} onChange={(code) => patch({ testCases: tests.map((test, index) => index === selectedTest ? { ...test, code } : test) })} rows={18} />
                            <Stack gap={4}>
                                <CodeField label="Stdin" language="plaintext" value={activeTest.input ?? ""} onChange={(input) => patch({ testCases: tests.map((test, index) => index === selectedTest ? { ...test, input } : test) })} rows={8} />
                                <CodeField label="Expected output" language="plaintext" value={activeTest.expectedStdout ?? activeTest.expectedOutput ?? ""} onChange={(value) => patch({ testCases: tests.map((test, index) => index === selectedTest ? { ...test, expectedStdout: value, expectedOutput: value } : test) })} rows={8} />
                            </Stack>
                        </div>
                    </div> : <div className="grid min-h-72 place-items-center rounded-lg border border-dashed"><Text tone="muted">Add a test case to configure automatic checking.</Text></div>}
                </div>
            </Panel>
        </Stack>
    )
}

const EXAM_LOCATIONS: ExamTimeslot["location"][] = ["A-101", "A-102", "B-201", "C-301", "Main hall"]

function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const selected = new Date(`${value}T12:00:00`)
    const [month, setMonth] = React.useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
    const [open, setOpen] = React.useState(false)
    const firstWeekday = month.getDay()
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-start font-normal"><CalendarDays className="mr-2 size-4" />{selected.toLocaleDateString()}</Button></PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
            <Group justify="between"><Button type="button" size="icon" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button><Text weight="medium">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</Text><Button type="button" size="icon" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button></Group>
            <div className="mt-2 grid grid-cols-7 text-center text-xs text-muted-foreground">{["Su","Mo","Tu","We","Th","Fr","Sa"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="mt-1 grid grid-cols-7">{Array.from({ length: firstWeekday }).map((_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => index + 1).map((day) => { const date = new Date(month.getFullYear(), month.getMonth(), day); const dateValue = format(date); return <Button key={day} type="button" size="icon" variant={dateValue === value ? "default" : "ghost"} className="size-9" onClick={() => { onChange(dateValue); setOpen(false) }}>{day}</Button> })}</div>
        </PopoverContent>
    </Popover>
}

function TimeslotsEditor({ timeslots, onCreate, onChange, onDelete }: {
    timeslots: ExamTimeslot[]
    onCreate: () => void
    onChange: (slot: ExamTimeslot, patch: Partial<Pick<ExamTimeslot, "location" | "startsAt" | "capacity">>) => void
    onDelete: (slot: ExamTimeslot) => void
}) {
    return (
        <Panel className="p-5">
            <Group justify="between">
                <div><Heading level={2} size="md">Exam timeslots</Heading><Text tone="muted" size="sm">Students may register for one timeslot.</Text></div>
                <Button type="button" variant="outline" onClick={onCreate}><Plus className="mr-2 size-4" />Add timeslot</Button>
            </Group>
            <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="p-2">#</th><th className="p-2">Date</th><th className="p-2">Time</th><th className="p-2">Room</th><th className="p-2">Capacity</th><th className="p-2" /></tr></thead><tbody>{timeslots.map((slot, index) => { const local = toLocalDateTime(slot.startsAt); return <tr key={slot.id} className="border-t align-middle"><td className="p-2">{index + 1}</td><td className="p-2"><DatePicker value={local.slice(0, 10)} onChange={(date) => onChange(slot, { startsAt: new Date(`${date}T${local.slice(11, 16)}`).toISOString() })} /></td><td className="p-2"><Input type="time" value={local.slice(11, 16)} onChange={(event) => onChange(slot, { startsAt: new Date(`${local.slice(0, 10)}T${event.target.value}`).toISOString() })} /></td><td className="p-2"><Select value={slot.location} onValueChange={(location: ExamTimeslot["location"]) => onChange(slot, { location })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXAM_LOCATIONS.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent></Select></td><td className="p-2"><Input type="number" min={1} max={10000} value={slot.capacity} onChange={(event) => Number(event.target.value) > 0 && onChange(slot, { capacity: Number(event.target.value) })} /></td><td className="p-2"><Button type="button" size="icon" variant="ghost" onClick={() => onDelete(slot)} aria-label="Delete timeslot"><Trash2 className="size-4" /></Button></td></tr>})}</tbody></table>{!timeslots.length ? <Text tone="muted">No timeslots yet.</Text> : null}</div>
        </Panel>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    )
}
function CodeField({
    label,
    value,
    onChange,
    language,
    rows = 9,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    language: CodingLanguage | "plaintext"
    rows?: number
}) {
    const monacoLanguage = language === "plaintext" ? "plaintext" : {
        [CodingLanguage.JavaScript]: "javascript",
        [CodingLanguage.Java]: "java",
        [CodingLanguage.Cpp]: "cpp",
        [CodingLanguage.Python]: "python",
        [CodingLanguage.Sql]: "sql",
    }[language]
    return (
        <Field label={label}>
            <DebouncedMonacoEditor
                value={value}
                onChange={onChange}
                language={monacoLanguage}
                height={`${Math.max(rows * 22 + 32, 120)}px`}
            />
        </Field>
    )
}
function toLocalDateTime(value: string) {
    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}
function errorMessage(reason: unknown, fallback: string) {
    if (
        typeof reason === "object" &&
        reason !== null &&
        "message" in reason &&
        typeof reason.message === "string"
    ) {
        return reason.message
    }
    return fallback
}

function slugify(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 255) || "untitled-exam"
}

function printDefault(language: CodingLanguage) {
    if (language === CodingLanguage.Python) return "print(actual)"
    if (language === CodingLanguage.Java) return "System.out.println(actual);"
    if (language === CodingLanguage.Cpp) return "std::cout << actual << std::endl;"
    return "console.log(actual)"
}
