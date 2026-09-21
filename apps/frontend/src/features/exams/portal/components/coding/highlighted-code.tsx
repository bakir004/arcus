import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-c"
import "prismjs/components/prism-cpp"
import "prismjs/components/prism-java"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-sql"

export function HighlightedCode({ code, language = "javascript" }: { code: string; language?: string }) {
    const grammar = Prism.languages[language] ?? Prism.languages.javascript
    const highlighted = Prism.highlight(code, grammar, language)

    return (
        <pre className="bg-background text-foreground overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
            <code
                className={`language-${language}`}
                // Prism returns escaped HTML with token spans.
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        </pre>
    )
}
