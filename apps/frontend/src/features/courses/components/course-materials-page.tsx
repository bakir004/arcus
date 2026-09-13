import { type FormEvent, type HTMLAttributes, useEffect, useMemo, useState } from 'react';
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
import { siC, siCplusplus, siCss, siHtml5, siJavascript, siOpenjdk, siPython, siTypescript } from 'simple-icons';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Box, Group } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    getCourseMaterialUrlRequest,
    type CourseContentElement,
    type CourseMaterial,
    type MaterialGroup,
    useGetCourseMaterials,
} from '@/features/courses/api/get-course-materials';
import { useGetCourseByCode } from '@/features/courses/api/get-course';
import { useGetCourseMe } from '@/features/courses/api/get-course-me';
import { useCreateCourseMaterial } from '@/features/courses/api/create-course-material';
import { useCreateCourseMaterialGroup } from '@/features/courses/api/create-course-material-group';
import { useMoveCourseMaterial } from '@/features/courses/api/move-course-material';
import { useMoveCourseMaterialGroup } from '@/features/courses/api/move-course-material-group';
import {
    ChevronDown,
    ClipboardList,
    Copy,
    Database,
    Download,
    ExternalLink,
    FileArchive,
    FileText,
    FileType,
    GripVertical,
    Image,
    Link as LinkIcon,
    Search,
    Video,
    Loader2,
    Plus,
    Upload,
} from 'lucide-react';

type SimpleIconData = { title: string; path: string };

function SimpleIcon({ icon }: { icon: SimpleIconData }) {
    return (
        <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className="size-4">
            <path fill="currentColor" d={icon.path} />
        </svg>
    );
}

function isGroup(item: CourseContentElement): item is MaterialGroup {
    return 'materials' in item;
}
function title(material: CourseMaterial) {
    return material.kind === 'TEXT' ? 'Text note' : material.title;
}
function slugify(value: string) {
    return (
        value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'group'
    );
}
function groupAnchor(group: MaterialGroup, index: number) {
    return `group-${slugify(group.name ?? 'root')}-${index + 1}`;
}
function scrollToGroup(anchorId: string) {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function extension(fileName: string | null) {
    return fileName?.split('.').pop()?.toLowerCase() ?? '';
}
function language(fileName: string | null) {
    return (
        (
            {
                js: 'javascript',
                jsx: 'jsx',
                ts: 'typescript',
                tsx: 'tsx',
                py: 'python',
                java: 'java',
                c: 'c',
                h: 'c',
                cpp: 'cpp',
                cc: 'cpp',
                cxx: 'cpp',
                css: 'css',
                sql: 'sql',
            } as Record<string, string>
        )[extension(fileName)] ?? null
    );
}
function previewable(material: CourseMaterial) {
    if (material.kind !== 'FILE') return false;
    const ext = extension(material.fileName);
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return false;
    const mime = material.fileMimeType?.toLowerCase() ?? '';
    return (
        (Boolean(language(material.fileName)) ||
            ['md', 'txt', 'html', 'htm', 'xhtml'].includes(ext) ||
            mime.startsWith('text/') ||
            mime.startsWith('image/') ||
            mime.startsWith('video/') ||
            mime.includes('pdf')) &&
        ext !== 'csv'
    );
}
function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value.trim());
        return value.trim().length <= 2048 && (url.protocol === 'http:' || url.protocol === 'https:');
    } catch {
        return false;
    }
}
function bytes(value: number | null) {
    if (!value) return 'File';
    if (value < 1024) return `${value} B`;
    if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1048576).toFixed(1)} MB`;
}
function icon(material: CourseMaterial) {
    if (material.kind === 'LINK') return { Icon: LinkIcon, color: 'text-cyan-500 bg-cyan-500/10' };
    if (material.kind === 'TEXT') return { Icon: FileText, color: 'text-foreground bg-muted' };
    if (extension(material.fileName) === 'sql') return { Icon: Database, color: 'text-emerald-500 bg-emerald-500/10' };
    const codeIcons: Record<string, { simpleIcon: SimpleIconData; color: string }> = {
        js: { simpleIcon: siJavascript, color: 'text-[#F7DF1E] bg-[#F7DF1E]/10' },
        jsx: { simpleIcon: siJavascript, color: 'text-[#F7DF1E] bg-[#F7DF1E]/10' },
        ts: { simpleIcon: siTypescript, color: 'text-[#3178C6] bg-[#3178C6]/10' },
        tsx: { simpleIcon: siTypescript, color: 'text-[#3178C6] bg-[#3178C6]/10' },
        cpp: { simpleIcon: siCplusplus, color: 'text-[#00599C] bg-[#00599C]/10' },
        cc: { simpleIcon: siCplusplus, color: 'text-[#00599C] bg-[#00599C]/10' },
        cxx: { simpleIcon: siCplusplus, color: 'text-[#00599C] bg-[#00599C]/10' },
        c: { simpleIcon: siC, color: 'text-[#A8B9CC] bg-[#A8B9CC]/10' },
        h: { simpleIcon: siC, color: 'text-[#A8B9CC] bg-[#A8B9CC]/10' },
        html: { simpleIcon: siHtml5, color: 'text-[#E34F26] bg-[#E34F26]/10' },
        css: { simpleIcon: siCss, color: 'text-[#663399] bg-[#663399]/10' },
        java: { simpleIcon: siOpenjdk, color: 'text-[#ED8B00] bg-[#ED8B00]/10' },
        py: { simpleIcon: siPython, color: 'text-[#3776AB] bg-[#3776AB]/10' },
    };
    const codeIcon = codeIcons[extension(material.fileName)];
    if (codeIcon) return codeIcon;
    const mime = material.fileMimeType ?? '';
    if (mime.startsWith('video/')) return { Icon: Video, color: 'text-blue-500 bg-blue-500/10' };
    if (mime.startsWith('image/')) return { Icon: Image, color: 'text-pink-500 bg-pink-500/10' };
    if (mime.includes('zip') || mime.includes('archive'))
        return { Icon: FileArchive, color: 'text-purple-500 bg-purple-500/10' };
    if (mime.includes('pdf')) return { Icon: FileText, color: 'text-red-500 bg-red-500/10' };
    if (mime.includes('document') || mime.includes('word'))
        return { Icon: FileType, color: 'text-sky-500 bg-sky-500/10' };
    return { Icon: FileType, color: 'text-emerald-500 bg-emerald-500/10' };
}

function CodeDialog({
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
    const [copied, setCopied] = useState(false);
    const copyCode = async () => {
        if (!code) return;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const didCopy = document.execCommand('copy');
            textarea.remove();
            if (!didCopy) throw new Error('copy failed');
        }
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
                <div className="scrollbar-thin min-h-0 flex-1 overflow-auto rounded-lg border bg-background text-foreground">
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

function MaterialRow({
    courseId,
    material,
    dragHandle,
}: {
    courseId: string;
    material: CourseMaterial;
    dragHandle: React.ReactNode;
}) {
    const materialIcon = icon(material);
    const Icon = 'Icon' in materialIcon ? materialIcon.Icon : undefined;
    const [dialog, setDialog] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileName =
        material.kind === 'FILE'
            ? (material.fileName ?? material.title)
            : material.kind === 'LINK'
              ? material.title
              : 'Text note';
    const lang = material.kind === 'FILE' ? language(material.fileName) : null;
    const open = async () => {
        if (material.kind === 'LINK') {
            window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
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
            <div className="flex gap-3 px-5 py-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {dragHandle}
                {material.textContent}
            </div>
        );
    return (
        <>
            <div className="flex items-center gap-3 px-5 py-3.5">
                {dragHandle}
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${materialIcon.color}`}>
                    {'simpleIcon' in materialIcon ? (
                        <SimpleIcon icon={materialIcon.simpleIcon} />
                    ) : Icon ? (
                        <Icon className="size-4" />
                    ) : null}
                </div>
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        disabled={material.kind === 'FILE' && !previewable(material)}
                        onClick={() => void open().catch(() => toast.error('Failed to preview file.'))}
                        className={`block max-w-full truncate text-left text-sm font-medium ${material.kind === 'LINK' || (material.kind === 'FILE' && previewable(material)) ? 'cursor-pointer underline-offset-4 hover:underline' : 'cursor-default'}`}
                    >
                        {title(material)}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {material.kind === 'FILE'
                            ? (material.description ?? 'File')
                            : (material.description ?? 'External link')}
                    </p>
                </div>
                {material.kind === 'LINK' ? (
                    <a
                        href={material.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${material.title}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
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
            </div>
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

function SortableMaterial({ courseId, material }: { courseId: string; material: CourseMaterial }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: material.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition: isDragging ? undefined : transition }}
            className={isDragging ? 'relative z-10 opacity-70' : undefined}
        >
            <MaterialRow
                courseId={courseId}
                material={material}
                dragHandle={
                    <button
                        type="button"
                        aria-label={`Reorder ${title(material)}`}
                        {...attributes}
                        {...listeners}
                        className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    >
                        <GripVertical className="size-4" />
                    </button>
                }
            />
        </div>
    );
}

function SortableGroupCard({
    courseId,
    group,
    anchorId,
}: {
    courseId: string;
    group: MaterialGroup;
    anchorId?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition: isDragging ? undefined : transition }}
            className={isDragging ? 'opacity-70' : undefined}
        >
            <GroupCard
                courseId={courseId}
                group={group}
                anchorId={anchorId}
                groupDragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

function DraggableGroup({ group }: { group: MaterialGroup }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `preview-${group.id}`,
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{ transform: CSS.Translate.toString(transform), transition: isDragging ? undefined : transition }}
            className={`cursor-grab rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/40 active:cursor-grabbing ${isDragging ? 'opacity-70' : ''}`}
        >
            {group.name ?? 'Root materials'}
        </div>
    );
}

function GroupCard({
    courseId,
    group,
    standalone = false,
    anchorId,
    groupDragHandleProps,
}: {
    courseId: string;
    group: MaterialGroup;
    standalone?: boolean;
    anchorId?: string;
    groupDragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
    const [materials, setMaterials] = useState(group.materials);
    const [collapsed, setCollapsed] = useState(false);
    const moveMaterial = useMoveCourseMaterial();
    useEffect(() => setMaterials(group.materials), [group.materials]);
    const sensors = useSensors(useSensor(PointerSensor));
    const reorder = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const oldIndex = materials.findIndex((item) => item.id === active.id);
        const newIndex = materials.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setMaterials((current) => arrayMove(current, oldIndex, newIndex));
        if (!standalone)
            void moveMaterial
                .mutateAsync({ courseId, materialId: String(active.id), groupId: group.id, position: newIndex })
                .catch(() => toast.error('Failed to save material order.'));
    };
    return (
        <section
            id={anchorId}
            data-group-id={group.id}
            data-group-name={group.name ?? ''}
            className={`scroll-mt-24 overflow-hidden rounded-lg border ${group.name === null ? 'border-red-500 bg-red-500/10' : 'border-border bg-card'}`}
        >
            {!standalone && (
                <Group
                    gap={4}
                    className="cursor-pointer px-5 py-5 transition-colors hover:bg-muted/50"
                    onClick={() => setCollapsed((value) => !value)}
                >
                    <button
                        type="button"
                        {...groupDragHandleProps}
                        aria-label={`Drag ${group.name ?? 'root materials'}`}
                        className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <GripVertical className="size-4" />
                    </button>
                    <Box className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ClipboardList className="size-5" />
                    </Box>
                    <div className="min-w-0 flex-1">
                        <Group gap={2}>
                            <h2 className="truncate font-semibold">{group.name ?? 'Root materials'}</h2>
                            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                {materials.length} {materials.length === 1 ? 'item' : 'items'}
                            </span>
                        </Group>
                        {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
                    </div>
                    <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? '-rotate-90' : ''}`}
                    />
                </Group>
            )}
            {!collapsed && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
                    <SortableContext items={materials.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <div
                            className={
                                standalone ? 'divide-y divide-border' : 'divide-y divide-border border-t border-border'
                            }
                        >
                            {materials.length ? (
                                materials.map((material) => (
                                    <SortableMaterial key={material.id} courseId={courseId} material={material} />
                                ))
                            ) : (
                                <p className="px-5 py-6 text-sm text-muted-foreground">
                                    This group currently has no elements
                                </p>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </section>
    );
}

function CreateCourseMaterialGroupDialog({
    courseId,
    onCreated,
}: {
    courseId: string;
    onCreated?: (key: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const createGroup = useCreateCourseMaterialGroup();

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await createGroup.mutateAsync({ courseId, name, description });
            toast.success('Material group created.');
            onCreated?.(name);
            setName('');
            setDescription('');
            setOpen(false);
        } catch {
            toast.error('Failed to create material group.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="size-4" />
                    Create material group
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Create material group</DialogTitle>
                        <DialogDescription>
                            Organize materials by week, topic, or any grouping you prefer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="material-group-name">Name</Label>
                        <Input
                            id="material-group-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            maxLength={200}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="material-group-description">Description</Label>
                        <textarea
                            id="material-group-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={2000}
                            className="min-h-24 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createGroup.isPending}>
                            {createGroup.isPending && <Loader2 className="size-4 animate-spin" />}Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateCourseMaterialDialog({
    courseId,
    groups,
    onCreated,
}: {
    courseId: string;
    groups: MaterialGroup[];
    onCreated?: (key: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<'FILE' | 'LINK' | 'TEXT'>('FILE');
    const [groupId, setGroupId] = useState('');
    const [titleValue, setTitleValue] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | undefined>();
    const createMaterial = useCreateCourseMaterial();

    const reset = () => {
        setKind('FILE');
        setGroupId('');
        setTitleValue('');
        setDescription('');
        setExternalUrl('');
        setTextContent('');
        setFile(undefined);
    };
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (kind === 'FILE' && !file) {
            toast.error('Choose a file to upload.');
            return;
        }
        if (kind === 'LINK' && !isValidHttpUrl(externalUrl)) {
            toast.error('Enter a valid HTTP or HTTPS URL.');
            return;
        }
        const input =
            kind === 'FILE'
                ? { kind, title: titleValue, description }
                : kind === 'LINK'
                  ? { kind, title: titleValue, description, externalUrl: externalUrl.trim() }
                  : { kind, textContent };
        try {
            await createMaterial.mutateAsync({ courseId, groupId: groupId || null, input, file });
            toast.success('Course material created.');
            onCreated?.(groupId || null);
            reset();
            setOpen(false);
        } catch {
            toast.error('Failed to create course material.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="size-4" />
                    Create course material
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Create course material</DialogTitle>
                        <DialogDescription>Add a file, link, or text note for this course.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="material-kind">Type</Label>
                        <select
                            id="material-kind"
                            value={kind}
                            onChange={(event) => setKind(event.target.value as typeof kind)}
                            className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm"
                        >
                            <option value="FILE">File</option>
                            <option value="LINK">Link</option>
                            <option value="TEXT">Text note</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="material-group">Group</Label>
                        <select
                            id="material-group"
                            value={groupId}
                            onChange={(event) => setGroupId(event.target.value)}
                            className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm"
                        >
                            <option value="">None</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {kind !== 'TEXT' ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="material-title">Title</Label>
                                <Input
                                    id="material-title"
                                    value={titleValue}
                                    onChange={(event) => setTitleValue(event.target.value)}
                                    required
                                    maxLength={255}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="material-description">Description</Label>
                                <textarea
                                    id="material-description"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    maxLength={2000}
                                    className="min-h-20 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="material-text">Text</Label>
                            <textarea
                                id="material-text"
                                value={textContent}
                                onChange={(event) => setTextContent(event.target.value)}
                                required
                                maxLength={100000}
                                className="min-h-32 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                        </div>
                    )}
                    {kind === 'LINK' && (
                        <div className="space-y-2">
                            <Label htmlFor="material-url">URL</Label>
                            <Input
                                id="material-url"
                                type="url"
                                value={externalUrl}
                                onChange={(event) => setExternalUrl(event.target.value)}
                                placeholder="https://"
                                maxLength={2048}
                                pattern="https?://.+"
                                required
                            />
                        </div>
                    )}
                    {kind === 'FILE' && (
                        <div className="space-y-2">
                            <Label htmlFor="material-file">File</Label>
                            <Input
                                id="material-file"
                                type="file"
                                onChange={(event) => setFile(event.target.files?.[0])}
                                required
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMaterial.isPending}>
                            {createMaterial.isPending && <Loader2 className="size-4 animate-spin" />}Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function CourseMaterialsPage() {
    const { code } = useParams({ from: '/courses/$code/materials' });
    const { data: course, isLoading: courseLoading } = useGetCourseByCode(code);
    const { data: content, isLoading, isError } = useGetCourseMaterials(course?.id ?? '');
    const { data: courseMe } = useGetCourseMe(course?.id ?? '');
    const [search, setSearch] = useState('');
    const [scrollTarget, setScrollTarget] = useState<string | null | undefined>();
    const materialGroups = useMemo(
        () => (content ?? []).filter(isGroup).filter((group) => group.name !== null),
        [content],
    );
    const canCreateMaterial = courseMe?.permissions.includes('course:material:create') ?? false;
    const moveGroup = useMoveCourseMaterialGroup();
    const queryClient = useQueryClient();
    const groupSensors = useSensors(useSensor(PointerSensor));
    const previewSensors = useSensors(useSensor(PointerSensor));
    const groups = useMemo(() => {
        const q = search.toLowerCase().trim();
        return (content ?? [])
            .filter(isGroup)
            .map((group) => ({
                group: {
                    ...group,
                    materials: group.materials.filter(
                        (material) =>
                            !q ||
                            title(material).toLowerCase().includes(q) ||
                            (material.kind !== 'TEXT' && (material.description ?? '').toLowerCase().includes(q)),
                    ),
                },
            }))
            .filter(({ group }) => group.materials.length || (!q && group.materials.length === 0));
    }, [content, search]);
    const [orderedGroups, setOrderedGroups] = useState<typeof groups>([]);
    useEffect(() => {
        if (!search.trim()) setOrderedGroups(groups);
    }, [content, search]);
    const displayedGroups = search.trim() ? groups : orderedGroups.length ? orderedGroups : groups;
    const reorderGroups = (activeId: string, overId: string) => {
        if (activeId === overId || search.trim()) return;
        const oldIndex = displayedGroups.findIndex(({ group }) => group.id === activeId);
        const newIndex = displayedGroups.findIndex(({ group }) => group.id === overId);
        if (oldIndex < 0 || newIndex < 0) return;
        setOrderedGroups((current) => arrayMove(current, oldIndex, newIndex));
        void moveGroup
            .mutateAsync({ courseId: course?.id ?? '', groupId: activeId, position: newIndex })
            .catch(() => {
                void queryClient.refetchQueries({
                    queryKey: ['courses', course?.id ?? '', 'materials'],
                    type: 'active',
                });
                toast.error('Failed to save group order.');
            });
    };
    const handleGroupDragEnd = ({ active, over }: DragEndEvent) => {
        if (over) reorderGroups(String(active.id), String(over.id));
    };
    const reorderPreviewGroups = ({ active, over }: DragEndEvent) => {
        if (over)
            reorderGroups(
                String(active.id).replace(/^preview-/, ''),
                String(over.id).replace(/^preview-/, ''),
            );
    };
    useEffect(() => {
        if (scrollTarget === undefined) return;
        const timeout = window.setTimeout(() => {
            const element = Array.from(document.querySelectorAll<HTMLElement>('[data-group-id]')).find((candidate) =>
                scrollTarget
                    ? candidate.dataset.groupId === scrollTarget || candidate.dataset.groupName === scrollTarget
                    : candidate.dataset.groupName === '',
            );
            if (!element) return;
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setScrollTarget(undefined);
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [scrollTarget]);
    if (courseLoading)
        return (
            <Box as="main" className="p-8 text-muted-foreground">
                Loading course…
            </Box>
        );
    if (!course)
        return (
            <Box as="main" className="p-8">
                Course not found.
            </Box>
        );
    return (
        <Box as="main" className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-10">
            <Box className="min-w-0 flex-1">
                {!search.trim() && !isLoading && !isError && groups.length > 0 && (
                    <div className="mb-6" data-testid="course-groups-dnd">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Course groups</h2>
                            <span className="text-xs text-muted-foreground">Drag to reorder</span>
                        </div>
                        <DndContext
                            sensors={previewSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={reorderPreviewGroups}
                        >
                            <SortableContext
                                items={displayedGroups.map(({ group }) => `preview-${group.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-3" role="list" aria-label="Course groups">
                                    {displayedGroups.map(({ group }) => (
                                        <DraggableGroup key={group.id} group={group} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
                {canCreateMaterial && (
                    <div className="mb-4 flex flex-wrap justify-end gap-2">
                        <CreateCourseMaterialGroupDialog courseId={course.id} onCreated={setScrollTarget} />
                        <CreateCourseMaterialDialog
                            courseId={course.id}
                            groups={materialGroups}
                            onCreated={setScrollTarget}
                        />
                    </div>
                )}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search course materials..."
                        className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="mt-6 space-y-4">
                    {isLoading ? (
                        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                            Loading materials…
                        </div>
                    ) : isError ? (
                        <div className="rounded-lg border border-border bg-card p-8 text-center text-destructive">
                            Unable to load course materials.
                        </div>
                    ) : displayedGroups.length ? (
                        <DndContext sensors={groupSensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
                            <SortableContext
                                items={displayedGroups.map(({ group }) => group.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {displayedGroups.map(({ group }, index) => (
                                    <SortableGroupCard
                                        key={group.id}
                                        courseId={course.id}
                                        group={group}
                                        anchorId={groupAnchor(group, index)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                            No course materials found.
                        </div>
                    )}
                </div>
            </Box>
            <Box as="aside" className="hidden w-56 shrink-0 xl:block">
                <Box className="sticky top-20 rounded-lg border border-border bg-card p-3">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contents
                    </p>
                    <nav className="mt-1 space-y-1">
                        <a
                            href="#top"
                            className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            Materials
                        </a>
                        {displayedGroups.map(({ group }, index) => (
                            <a
                                key={group.id}
                                href={`#${groupAnchor(group, index)}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    scrollToGroup(groupAnchor(group, index));
                                }}
                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                {group.name}
                            </a>
                        ))}
                    </nav>
                </Box>
            </Box>
        </Box>
    );
}
