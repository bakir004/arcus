import * as React from "react"
import MonacoEditor from "@monaco-editor/react"
import { useTheme } from "@/hooks/use-theme"
import myThemeData from "@/lib/monokai.json"

export const DebouncedMonacoEditor = React.memo(function DebouncedMonacoEditor({
    value,
    onChange,
    language,
    height = "240px",
    debounceMs = 400,
}: {
    value: string
    onChange: (value: string) => void
    language: string
    height?: string
    debounceMs?: number
}) {
    const { isDark } = useTheme()
    const editorRef = React.useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null)
    const onChangeRef = React.useRef(onChange)
    const timerRef = React.useRef<number | null>(null)
    const pendingRef = React.useRef(value)
    const emittedRef = React.useRef(value)

    React.useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    React.useEffect(() => {
        const editor = editorRef.current
        if (!editor || editor.getValue() === value || value === pendingRef.current) return
        pendingRef.current = value
        emittedRef.current = value
        editor.setValue(value)
    }, [value])

    const flush = React.useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        if (pendingRef.current === emittedRef.current) return
        emittedRef.current = pendingRef.current
        onChangeRef.current(pendingRef.current)
    }, [])

    React.useEffect(() => () => flush(), [flush])

    return (
        <div className="overflow-hidden rounded-lg border" onBlur={flush}>
            <MonacoEditor
                height={height}
                language={language}
                defaultValue={value}
                theme={isDark ? "coding-builder-dark" : "vs"}
                beforeMount={(monaco) =>
                    monaco.editor.defineTheme("coding-builder-dark", myThemeData)
                }
                onMount={(editor) => {
                    editorRef.current = editor
                }}
                onChange={(nextValue) => {
                    pendingRef.current = nextValue ?? ""
                    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
                    timerRef.current = window.setTimeout(flush, debounceMs)
                }}
                options={{
                    fontSize: 14,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 22,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "off",
                    tabSize: 4,
                    renderLineHighlight: "line",
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    padding: { top: 14, bottom: 14 },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    formatOnPaste: true,
                    automaticLayout: true,
                }}
            />
        </div>
    )
})
