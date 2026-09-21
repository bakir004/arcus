import * as React from "react"
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CodeToggle,
    CreateLink,
    InsertTable,
    ListsToggle,
    MDXEditor,
    Separator,
    headingsPlugin,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

export const QuestionPromptEditor = React.memo(function QuestionPromptEditor({
    value,
    onChange,
    debounceMs = 400,
}: {
    value: string
    onChange: (value: string) => void
    debounceMs?: number
}) {
    const onChangeRef = React.useRef(onChange)
    const timerRef = React.useRef<number | null>(null)
    const pendingValueRef = React.useRef(value)
    const emittedValueRef = React.useRef(value)

    React.useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    const flush = React.useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        if (pendingValueRef.current === emittedValueRef.current) return
        emittedValueRef.current = pendingValueRef.current
        onChangeRef.current(pendingValueRef.current)
    }, [])

    React.useEffect(() => () => flush(), [flush])

    const plugins = React.useMemo(
        () => [
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            thematicBreakPlugin(),
            toolbarPlugin({
                toolbarContents: () => (
                    <>
                        <BlockTypeSelect />
                        <Separator />
                        <BoldItalicUnderlineToggles />
                        <CodeToggle />
                        <Separator />
                        <ListsToggle />
                        <Separator />
                        <CreateLink />
                        <InsertTable />
                    </>
                ),
            }),
        ],
        [],
    )

    return (
        <div className="overflow-hidden rounded-md border bg-background" onBlur={flush}>
            <MDXEditor
                markdown={value}
                onChange={(markdown) => {
                    pendingValueRef.current = markdown
                    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
                    timerRef.current = window.setTimeout(flush, debounceMs)
                }}
                plugins={plugins}
                className="coding-mdx-editor max-h-[520px] overflow-y-auto"
                contentEditableClassName="coding-mdx-content prose prose-sm min-h-52 max-w-none px-5 py-4 focus:outline-none dark:prose-invert"
                placeholder="Write the question prompt here…"
            />
        </div>
    )
})
