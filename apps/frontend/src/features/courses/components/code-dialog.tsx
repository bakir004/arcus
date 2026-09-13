import { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/use-theme';

export function CodeDialog({
    open,
    onClose,
    fileName,
    lang,
    code,
    loading,
}: {
    open: boolean;
    onClose: () => void;
    fileName: string;
    lang: string;
    code: string | null;
    loading: boolean;
}) {
    const highlighted = Prism.highlight(code ?? '', Prism.languages[lang] ?? Prism.languages.plain, lang);
    const { isDark } = useTheme();
    const [copied, setCopied] = useState(false);
    const copyCode = async () => {
        if (!code) return;
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        toast.success('Code copied.');
    };
    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="flex max-h-[85vh] grid-rows-none flex-col overflow-hidden sm:max-w-4xl">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-3 pr-8">
                        <DialogTitle className="truncate">{fileName}</DialogTitle>
                        <button
                            type="button"
                            disabled={!code || loading}
                            onClick={() => void copyCode().catch(() => toast.error('Failed to copy code.'))}
                            className={
                                copied
                                    ? 'flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-secondary bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors disabled:pointer-events-none disabled:opacity-50'
                                    : 'flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
                            }
                        >
                            <Copy className="size-4" />
                            {copied ? 'Copied!' : 'Copy code'}
                        </button>
                    </div>
                </DialogHeader>
                <div
                    className={`scrollbar-thin min-h-0 flex-1 overflow-auto rounded-lg border bg-background text-foreground ${isDark ? '' : 'prism-theme-light'}`}
                >
                    {loading ? (
                        <p className="p-4 text-sm text-muted-foreground">Loading preview...</p>
                    ) : (
                        <pre className="min-w-max p-4 text-sm leading-6">
                            <code
                                className={`language-${lang}`} // biome-ignore lint/security/noDangerouslySetInnerHtml: Prism generates highlighted markup.
                                dangerouslySetInnerHTML={{ __html: highlighted }}
                            />
                        </pre>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

