import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'
import { highlightCode } from '@/features/courses/materials/lib/prism'

interface MarkdownProps {
    children: string
    className?: string
}

const markdownComponents: Components = {
    a({ href, children, ...props }) {
        return (
            <a href={href} {...props} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        )
    },
    code({ className, children }) {
        const language = /language-([\w-]+)/.exec(className ?? '')?.[1]
        if (!language) {
            return <code className={`${className ?? ''} before:content-none after:content-none`}>{children}</code>
        }

        const code = String(children).replace(/\n$/, '')
        const highlighted = highlightCode(code, language)
        return (
            <code
                className={`language-${language} before:content-none after:content-none`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        )
    },
}

/** The same GFM/Prism markdown preview used by course text materials. */
export function Markdown({ children, className }: MarkdownProps) {
    const { isDark } = useTheme()
    return (
        <div className={cn('markdown-preview prose prose-sm dark:prose-invert min-w-0 max-w-none overflow-x-auto break-words', isDark ? '' : 'prism-theme-light', className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {children}
            </ReactMarkdown>
        </div>
    )
}
