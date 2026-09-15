import { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUpDown, Download, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { getCourseMaterialUrlRequest, type CourseMaterial, type MaterialGroup } from '../api/get-course-materials';
import { useDeleteCourseMaterial } from '../api/delete-course-material';
import { useMoveCourseMaterial } from '../api/move-course-material';
import { bytes, extension, isPlatformLink, language, materialAppearance, previewable, title } from './material-utils';
import { CodeDialog } from './code-dialog';
import { DeleteCourseMaterialDialog } from './delete-course-material-dialog';
import { EditCourseMaterialDialog } from './course-material-dialogs';
import { highlightCode } from './prism';

const markdownComponents: Components = {
    code({ className, children }) {
        const language = /language-([\w-]+)/.exec(className ?? '')?.[1];
        if (!language)
            return <code className={`${className ?? ''} before:content-none after:content-none`}>{children}</code>;

        const code = String(children).replace(/\n$/, '');
        const highlighted = highlightCode(code, language);
        return (
            <code
                className={`language-${language} before:content-none after:content-none`} // biome-ignore lint/security/noDangerouslySetInnerHtml: Prism escapes source code before adding syntax markup.
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        );
    },
};

export function MaterialRow({
    courseId,
    material,
    groups,
    dragHandle,
}: {
    courseId: string;
    material: CourseMaterial;
    groups: MaterialGroup[];
    dragHandle: React.ReactNode;
}) {
    const { Icon, color: iconColor } = materialAppearance(material);
    const { isDark } = useTheme();
    const [dialog, setDialog] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const moveMaterial = useMoveCourseMaterial();
    const deleteMaterial = useDeleteCourseMaterial();
    const fileName =
        material.kind === 'FILE'
            ? (material.fileName ?? material.title)
            : material.kind === 'LINK'
              ? material.title
              : 'Text note';
    const lang = material.kind === 'FILE' ? language(material.fileName) : null;
    const fileExtension = material.kind === 'FILE' ? extension(material.fileName) : '';
    const platformLink = material.kind === 'LINK' && isPlatformLink(material.externalUrl);
    const open = async () => {
        if (material.kind === 'LINK') {
            if (platformLink) window.location.assign(material.externalUrl);
            else window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        if (material.kind !== 'FILE' || !previewable(material)) return;
        const { url } = await getCourseMaterialUrlRequest(courseId, material.id);
        if (!lang) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        setDialog(true);
        setLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('preview failed');
            setCode(await response.text());
        } finally {
            setLoading(false);
        }
    };
    const download = async () => {
        if (material.kind !== 'FILE') return;
        const { url } = await getCourseMaterialUrlRequest(courseId, material.id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('download failed');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(await response.blob());
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    if (material.kind === 'TEXT')
        return (
            <>
                <div className="flex items-start gap-3 px-5 py-5">
                    {dragHandle}
                    <div
                        className={`markdown-preview prose prose-sm dark:prose-invert min-w-0 max-w-none flex-1 overflow-x-auto break-words ${isDark ? '' : 'prism-theme-light'}`}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {material.textContent}
                        </ReactMarkdown>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label={`Actions for ${title(material)}`}
                                className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <MoreVertical className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <ArrowUpDown /> Move to
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {groups.map((group) => (
                                        <DropdownMenuItem
                                            key={group.id}
                                            disabled={group.id === material.courseGroupId}
                                            onSelect={() =>
                                                void moveMaterial
                                                    .mutateAsync({
                                                        courseId,
                                                        materialId: material.id,
                                                        groupId: group.id,
                                                        position: group.materials.length,
                                                    })
                                                    .catch(() => toast.error('Failed to move material.'))
                                            }
                                        >
                                            {group.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <EditCourseMaterialDialog
                    courseId={courseId}
                    material={material}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                />
                <DeleteCourseMaterialDialog
                    name={title(material)}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    pending={deleteMaterial.isPending}
                    onConfirm={() =>
                        void deleteMaterial
                            .mutateAsync({ courseId, materialId: material.id })
                            .then(() => setDeleteOpen(false))
                            .catch(() => toast.error('Failed to delete material.'))
                    }
                />
            </>
        );
    return (
        <>
            <div className="flex items-center gap-3 px-5 py-3.5">
                {dragHandle}
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            disabled={material.kind === 'FILE' && !previewable(material)}
                            onClick={() => void open().catch(() => toast.error('Failed to preview file.'))}
                            className={`min-w-0 !cursor-default truncate text-left text-sm font-medium ${material.kind === 'LINK' || (material.kind === 'FILE' && previewable(material)) ? '!cursor-pointer underline-offset-4 hover:underline' : 'cursor-default'}`}
                        >
                            {title(material)}
                        </button>
                        {fileExtension && (
                            <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {fileExtension}
                            </span>
                        )}
                    </div>
                    {material.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{material.description}</p>
                    )}
                </div>
                {material.kind === 'LINK' ? (
                    <a
                        href={material.externalUrl}
                        {...(platformLink ? {} : { target: '_blank', rel: 'noreferrer' })}
                        aria-label={`Open ${material.title}`}
                        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ExternalLink className="size-4" />
                    </a>
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => void download().catch(() => toast.error('Failed to download file.'))}
                                    aria-label={`Download ${fileName}`}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <Download className="size-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>{bytes(material.fileSize)}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label={`Actions for ${title(material)}`}
                            className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <MoreVertical className="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                            <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <ArrowUpDown /> Move to
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {groups.map((group) => (
                                    <DropdownMenuItem
                                        key={group.id}
                                        disabled={group.id === material.courseGroupId}
                                        onSelect={() =>
                                            void moveMaterial
                                                .mutateAsync({
                                                    courseId,
                                                    materialId: material.id,
                                                    groupId: group.id,
                                                    position: group.materials.length,
                                                })
                                                .catch(() => toast.error('Failed to move material.'))
                                        }
                                    >
                                        {group.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                            <Trash2 /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <EditCourseMaterialDialog
                courseId={courseId}
                material={material}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DeleteCourseMaterialDialog
                name={title(material)}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                pending={deleteMaterial.isPending}
                onConfirm={() =>
                    void deleteMaterial
                        .mutateAsync({ courseId, materialId: material.id })
                        .then(() => setDeleteOpen(false))
                        .catch(() => toast.error('Failed to delete material.'))
                }
            />
            {lang && (
                <CodeDialog
                    open={dialog}
                    onClose={() => setDialog(false)}
                    fileName={fileName}
                    lang={lang}
                    code={code}
                    loading={loading}
                />
            )}
        </>
    );
}
