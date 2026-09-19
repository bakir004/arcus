import type { ComponentType } from 'react';
import {
    CornerUpRight,
    Database,
    FileArchive,
    FileText,
    FileType,
    Image,
    Link as LinkIcon,
    Sheet,
    Video,
} from 'lucide-react';
import { siC, siCplusplus, siCss, siHtml5, siJavascript, siOpenjdk, siPython, siTypescript } from 'simple-icons';
import type { CourseMaterial, MaterialGroup } from '../api/get-course-materials';

type SimpleIconData = { title: string; path: string };
type MaterialIcon = ComponentType<{ className?: string }>;
export type MaterialAppearance = { Icon: MaterialIcon; color: string };

function simpleIconComponent(icon: SimpleIconData): MaterialIcon {
    return function SimpleIcon({ className }: { className?: string }) {
        return (
            <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className={className}>
                <path fill="currentColor" d={icon.path} />
            </svg>
        );
    };
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
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
};
const PREVIEWABLE_EXTENSIONS = new Set(['md', 'txt', 'html', 'htm', 'xhtml']);
const NON_PREVIEWABLE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'csv']);
const SQL_EXTENSIONS = new Set(['sql']);
const CODE_ICONS_BY_EXTENSION: Record<string, MaterialAppearance> = {
    js: { Icon: simpleIconComponent(siJavascript), color: 'text-[#F7DF1E] bg-[#F7DF1E]/10' },
    jsx: { Icon: simpleIconComponent(siJavascript), color: 'text-[#F7DF1E] bg-[#F7DF1E]/10' },
    ts: { Icon: simpleIconComponent(siTypescript), color: 'text-[#3178C6] bg-[#3178C6]/10' },
    tsx: { Icon: simpleIconComponent(siTypescript), color: 'text-[#3178C6] bg-[#3178C6]/10' },
    cpp: { Icon: simpleIconComponent(siCplusplus), color: 'text-[#00599C] bg-[#00599C]/10' },
    cc: { Icon: simpleIconComponent(siCplusplus), color: 'text-[#00599C] bg-[#00599C]/10' },
    cxx: { Icon: simpleIconComponent(siCplusplus), color: 'text-[#00599C] bg-[#00599C]/10' },
    c: { Icon: simpleIconComponent(siC), color: 'text-[#A8B9CC] bg-[#A8B9CC]/10' },
    h: { Icon: simpleIconComponent(siC), color: 'text-[#A8B9CC] bg-[#A8B9CC]/10' },
    html: { Icon: simpleIconComponent(siHtml5), color: 'text-[#E34F26] bg-[#E34F26]/10' },
    css: { Icon: simpleIconComponent(siCss), color: 'text-[#663399] bg-[#663399]/10' },
    java: { Icon: simpleIconComponent(siOpenjdk), color: 'text-[#ED8B00] bg-[#ED8B00]/10' },
    py: { Icon: simpleIconComponent(siPython), color: 'text-[#3776AB] bg-[#3776AB]/10' },
};

export function title(material: CourseMaterial) {
    return material.kind === 'TEXT' ? 'Text note' : material.title;
}

/** Returns true when every query character appears in order within the value. */
export function fuzzyMatch(value: string, query: string) {
    const normalizedValue = value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const normalizedQuery = query
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (!normalizedQuery) return true;

    let queryIndex = 0;
    for (const character of normalizedValue) {
        if (character === normalizedQuery[queryIndex]) queryIndex += 1;
        if (queryIndex === normalizedQuery.length) return true;
    }

    return false;
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
export function groupAnchor(group: MaterialGroup, index: number) {
    return `group-${slugify(group.name)}-${index + 1}`;
}
export function scrollToGroup(anchorId: string) {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
export function extension(fileName: string | null) {
    return fileName?.split('.').pop()?.toLowerCase() ?? '';
}
export function language(fileName: string | null) {
    return LANGUAGE_BY_EXTENSION[extension(fileName)] ?? null;
}
export function previewable(material: CourseMaterial) {
    if (material.kind !== 'FILE') return false;
    const ext = extension(material.fileName);
    if (NON_PREVIEWABLE_EXTENSIONS.has(ext)) return false;
    const mime = material.fileMimeType?.toLowerCase() ?? '';
    return (
        Boolean(language(material.fileName)) ||
        PREVIEWABLE_EXTENSIONS.has(ext) ||
        mime.startsWith('text/') ||
        mime.startsWith('image/') ||
        mime.startsWith('video/') ||
        mime.includes('pdf')
    );
}
export function isPlatformLink(value: string) {
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        return origin !== undefined && new URL(value, origin).origin === origin;
    } catch {
        return false;
    }
}
export function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value.trim());
        return value.trim().length <= 2048 && (url.protocol === 'http:' || url.protocol === 'https:');
    } catch {
        return false;
    }
}
export function bytes(value: number | null) {
    if (!value) return 'File';
    if (value < 1024) return `${value} B`;
    if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1048576).toFixed(1)} MB`;
}
export function materialAppearance(material: CourseMaterial): MaterialAppearance {
    if (material.kind === 'LINK') {
        if (isPlatformLink(material.externalUrl))
            return { Icon: CornerUpRight, color: 'text-yellow-500 bg-yellow-500/10' };
        return { Icon: LinkIcon, color: 'text-cyan-500 bg-cyan-500/10' };
    }

    if (material.kind === 'TEXT') return { Icon: FileText, color: 'text-foreground bg-muted' };

    if (material.kind === 'FILE') {
        const fileExtension = extension(material.fileName);
        if (SQL_EXTENSIONS.has(fileExtension)) return { Icon: Database, color: 'text-emerald-500 bg-emerald-500/10' };
        if (fileExtension === 'csv') return { Icon: Sheet, color: 'text-green-500 bg-green-500/10' };

        const codeIcon = CODE_ICONS_BY_EXTENSION[fileExtension];
        if (codeIcon) return codeIcon;
        if (material.fileMimeType?.startsWith('video/')) return { Icon: Video, color: 'text-blue-500 bg-blue-500/10' };
        if (material.fileMimeType?.startsWith('image/')) return { Icon: Image, color: 'text-pink-500 bg-pink-500/10' };
        if (material.fileMimeType?.includes('zip') || material.fileMimeType?.includes('archive'))
            return { Icon: FileArchive, color: 'text-purple-500 bg-purple-500/10' };
        if (material.fileMimeType?.includes('pdf')) return { Icon: FileText, color: 'text-red-500 bg-red-500/10' };
        if (material.fileMimeType?.includes('document') || material.fileMimeType?.includes('word'))
            return { Icon: FileType, color: 'text-sky-500 bg-sky-500/10' };
        return { Icon: FileType, color: 'text-emerald-500 bg-emerald-500/10' };
    }

    throw new Error('Unsupported course material kind');
}
