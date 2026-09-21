import MonacoEditor from "@monaco-editor/react"
import { CodingLanguage, type CodingLanguage as CodingLanguageType } from "@/features/exams/types"
import { useTheme } from "@/hooks/use-theme"
import myThemeData from "@/lib/monokai.json"
import { internalEditorClipboard } from "../../lib/editor-clipboard"

export function CodeEditor({
    initialValue,
    onMount,
    onChange,
    language = CodingLanguage.JavaScript,
}: {
    initialValue: string
    onMount: (editor: import("monaco-editor").editor.IStandaloneCodeEditor) => void
    onChange?: (code: string) => void
    language?: CodingLanguageType
}) {
    const { isDark } = useTheme()

    function installInternalClipboard(
        editor: import("monaco-editor").editor.IStandaloneCodeEditor,
        monaco: typeof import("monaco-editor"),
    ) {
        const node = editor.getDomNode()
        if (!node) return

        const selectedText = () => {
            const model = editor.getModel()
            const selection = editor.getSelection()
            if (!model || !selection) return ""
            return model.getValueInRange(selection)
        }
        const deleteSelection = () => {
            const selection = editor.getSelection()
            if (!selection || selection.isEmpty()) return
            editor.executeEdits("internal-clipboard", [{ range: selection, text: "" }])
        }
        const pasteInternal = () => {
            if (!internalEditorClipboard.current) return
            editor.trigger("internal-clipboard", "type", { text: internalEditorClipboard.current })
        }
        const copyInternal = () => {
            internalEditorClipboard.current = selectedText()
        }
        const cutInternal = () => {
            internalEditorClipboard.current = selectedText()
            deleteSelection()
        }

        const copy = (event: ClipboardEvent) => {
            copyInternal()
            event.clipboardData?.setData("text/plain", "")
            event.preventDefault()
            event.stopPropagation()
        }
        const cut = (event: ClipboardEvent) => {
            cutInternal()
            event.clipboardData?.setData("text/plain", "")
            event.preventDefault()
            event.stopPropagation()
        }
        const paste = (event: ClipboardEvent) => {
            pasteInternal()
            event.preventDefault()
            event.stopPropagation()
        }

        const key = monaco.KeyMod.CtrlCmd
        editor.addCommand(key | monaco.KeyCode.KeyC, copyInternal)
        editor.addCommand(key | monaco.KeyCode.KeyX, cutInternal)
        editor.addCommand(key | monaco.KeyCode.KeyV, pasteInternal)
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, pasteInternal)

        node.addEventListener("copy", copy, true)
        node.addEventListener("cut", cut, true)
        node.addEventListener("paste", paste, true)
        editor.onDidDispose(() => {
            node.removeEventListener("copy", copy, true)
            node.removeEventListener("cut", cut, true)
            node.removeEventListener("paste", paste, true)
        })
    }

    return (
        <MonacoEditor
            height="100%"
            language={language}
            defaultValue={initialValue}
            theme={isDark ? "my-custom-theme" : "vs"}
            beforeMount={(monaco) => monaco.editor.defineTheme("my-custom-theme", myThemeData)}
            onMount={(editor, monaco) => {
                installInternalClipboard(editor, monaco)
                onMount(editor)
                if (onChange) {
                    editor.onDidChangeModelContent(() => onChange(editor.getValue()))
                }
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
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                formatOnPaste: true,
            }}
        />
    )
}
