import { useEffect, useState, type SubmitEvent } from 'react';
import { Loader2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WeekDatePicker } from '@/components/ui/week-date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CourseMaterial, MaterialGroup } from '../api/get-course-materials';
import { useCreateCourseMaterial } from '../api/create-course-material';
import { useCreateCourseMaterialGroup } from '../api/create-course-material-group';
import { useUpdateCourseMaterialGroup } from '../api/update-course-material-group';
import { useUpdateCourseMaterial } from '../api/update-course-material';
import { isValidHttpUrl } from '../lib/material-utils';

export function CreateCourseMaterialGroupDialog({
    courseId,
    onCreated,
}: {
    courseId: string;
    onCreated?: (key: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [labeled, setLabeled] = useState(true);
    const [weekStartDate, setWeekStartDate] = useState<string | null>(null);
    const createGroup = useCreateCourseMaterialGroup();

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await createGroup.mutateAsync({ courseId, name, description, labeled, weekStartDate });
            toast.success('Material group created.');
            onCreated?.(name);
            setName('');
            setDescription('');
            setLabeled(true);
            setWeekStartDate(null);
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
                        <Label htmlFor="material-group-name">Title</Label>
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
                    <div className="space-y-2">
                        <Label>Calendar week (optional)</Label>
                        <WeekDatePicker value={weekStartDate} onChange={setWeekStartDate} />
                    </div>
                    <div className="flex items-start gap-3">
                        <input
                            id="material-group-labeled"
                            type="checkbox"
                            checked={labeled}
                            aria-describedby="material-group-labeled-description"
                            onChange={(event) => setLabeled(event.target.checked)}
                            className="mt-1 size-4 rounded border-input accent-primary"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="material-group-labeled">Show title and description</Label>
                            <p id="material-group-labeled-description" className="text-xs text-muted-foreground">
                                Turn this off for an unlabeled section. The title remains visible to professors when
                                managing and moving materials so they can distinguish it from other unlabeled sections.
                            </p>
                        </div>
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

export function EditCourseMaterialGroupDialog({
    courseId,
    group,
    open,
    onOpenChange,
}: {
    courseId: string;
    group: MaterialGroup;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description ?? '');
    const [labeled, setLabeled] = useState(group.labeled);
    const [weekStartDate, setWeekStartDate] = useState<string | null>(group.weekStartDate);
    const updateGroup = useUpdateCourseMaterialGroup();

    useEffect(() => {
        setName(group.name);
        setDescription(group.description ?? '');
        setLabeled(group.labeled);
        setWeekStartDate(group.weekStartDate);
    }, [group]);

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await updateGroup.mutateAsync({ courseId, groupId: group.id, name, description, labeled, weekStartDate });
            toast.success('Material group updated.');
            onOpenChange(false);
        } catch {
            toast.error('Failed to update material group.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Edit material group</DialogTitle>
                        <DialogDescription>Update this material group.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor={`edit-material-group-name-${group.id}`}>Title</Label>
                        <Input
                            id={`edit-material-group-name-${group.id}`}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            maxLength={200}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`edit-material-group-description-${group.id}`}>Description</Label>
                        <textarea
                            id={`edit-material-group-description-${group.id}`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={2000}
                            className="min-h-24 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Calendar week (optional)</Label>
                        <WeekDatePicker value={weekStartDate} onChange={setWeekStartDate} />
                    </div>
                    <div className="flex items-start gap-3">
                        <input
                            id={`edit-material-group-labeled-${group.id}`}
                            type="checkbox"
                            checked={labeled}
                            aria-describedby={`edit-material-group-labeled-description-${group.id}`}
                            onChange={(event) => setLabeled(event.target.checked)}
                            className="mt-1 size-4 rounded border-input accent-primary"
                        />
                        <div className="space-y-1">
                            <Label htmlFor={`edit-material-group-labeled-${group.id}`}>
                                Show title and description
                            </Label>
                            <p
                                id={`edit-material-group-labeled-description-${group.id}`}
                                className="text-xs text-muted-foreground"
                            >
                                Turn this off for an unlabeled section. The title remains visible to professors when
                                managing and moving materials so they can distinguish it from other unlabeled sections.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateGroup.isPending}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function EditCourseMaterialDialog({
    courseId,
    material,
    open,
    onOpenChange,
}: {
    courseId: string;
    material: CourseMaterial;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [titleValue, setTitleValue] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [visibility, setVisibility] = useState(true);
    const [file, setFile] = useState<File | undefined>();
    const updateMaterial = useUpdateCourseMaterial();

    useEffect(() => {
        setFile(undefined);
        setVisibility(material.visibility);
        if (material.kind === 'TEXT') setTextContent(material.textContent);
        if (material.kind === 'LINK') {
            setTitleValue(material.title);
            setDescription(material.description ?? '');
            setExternalUrl(material.externalUrl);
        }
        if (material.kind === 'FILE') {
            setTitleValue(material.title);
            setDescription(material.description ?? '');
        }
    }, [material]);

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input =
            material.kind === 'TEXT'
                ? { kind: 'TEXT' as const, textContent }
                : material.kind === 'LINK'
                  ? { kind: 'LINK' as const, title: titleValue, description, externalUrl: externalUrl.trim() }
                  : { kind: 'FILE' as const, title: titleValue, description };
        try {
            await updateMaterial.mutateAsync({ courseId, materialId: material.id, input, visibility, file });
            toast.success('Course material updated.');
            onOpenChange(false);
        } catch {
            toast.error('Failed to update course material.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Edit course material</DialogTitle>
                        <DialogDescription>Update this course material.</DialogDescription>
                    </DialogHeader>
                    {material.kind !== 'TEXT' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor={`edit-title-${material.id}`}>Title</Label>
                                <Input
                                    id={`edit-title-${material.id}`}
                                    value={titleValue}
                                    onChange={(event) => setTitleValue(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`edit-description-${material.id}`}>Description</Label>
                                <textarea
                                    id={`edit-description-${material.id}`}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="min-h-20 w-full rounded-lg border border-border bg-card p-2 text-sm"
                                />
                            </div>
                            {material.kind === 'FILE' && (
                                <div className="space-y-2">
                                    <Label htmlFor={`edit-file-${material.id}`}>Replace file (optional)</Label>
                                    <Input
                                        id={`edit-file-${material.id}`}
                                        type="file"
                                        onChange={(event) => setFile(event.target.files?.[0])}
                                    />
                                </div>
                            )}
                            {material.kind === 'LINK' && (
                                <div className="space-y-2">
                                    <Label htmlFor={`edit-url-${material.id}`}>URL</Label>
                                    <Input
                                        id={`edit-url-${material.id}`}
                                        type="url"
                                        value={externalUrl}
                                        onChange={(event) => setExternalUrl(event.target.value)}
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}
                    {material.kind === 'TEXT' && (
                        <div className="space-y-2">
                            <Label htmlFor={`edit-text-${material.id}`}>Text</Label>
                            <textarea
                                id={`edit-text-${material.id}`}
                                value={textContent}
                                onChange={(event) => setTextContent(event.target.value)}
                                className="min-h-32 w-full rounded-lg border border-border bg-card p-2 text-sm"
                                required
                            />
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <input
                            id={`edit-visibility-${material.id}`}
                            type="checkbox"
                            checked={visibility}
                            onChange={(event) => setVisibility(event.target.checked)}
                            className="size-4 rounded border-input accent-primary"
                        />
                        <Label className="mt-0.25" htmlFor={`edit-visibility-${material.id}`}>
                            Visible to students
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={updateMaterial.isPending}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function CreateCourseMaterialDialog({
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
    const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
    const [titleValue, setTitleValue] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [visibility, setVisibility] = useState(true);
    const [file, setFile] = useState<File | undefined>();
    const createMaterial = useCreateCourseMaterial();
    useEffect(() => {
        if (!groups.some((group) => group.id === groupId)) setGroupId(groups[0]?.id ?? '');
    }, [groups, groupId]);

    const reset = () => {
        setKind('FILE');
        setGroupId(groups[0]?.id ?? '');
        setTitleValue('');
        setDescription('');
        setExternalUrl('');
        setTextContent('');
        setVisibility(true);
        setFile(undefined);
    };
    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (kind === 'FILE' && !file) {
            toast.error('Choose a file to upload.');
            return;
        }
        if (kind === 'LINK' && !isValidHttpUrl(externalUrl)) {
            toast.error('Enter a valid HTTP or HTTPS URL.');
            return;
        }
        if (!groupId) {
            toast.error('Choose a course group.');
            return;
        }
        const input =
            kind === 'FILE'
                ? { kind, title: titleValue, description }
                : kind === 'LINK'
                  ? { kind, title: titleValue, description, externalUrl: externalUrl.trim() }
                  : { kind, textContent };
        try {
            await createMaterial.mutateAsync({ courseId, groupId, input, visibility, file });
            toast.success('Course material created.');
            onCreated?.(groupId);
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="material-kind">Type</Label>
                            <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
                                <SelectTrigger id="material-kind" aria-label="Material type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FILE">File</SelectItem>
                                    <SelectItem value="LINK">Link</SelectItem>
                                    <SelectItem value="TEXT">Text note</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="material-group">Group</Label>
                            <Select value={groupId} onValueChange={setGroupId}>
                                <SelectTrigger id="material-group" aria-label="Material group">
                                    <SelectValue placeholder="Choose a group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                    <div className="flex items-start gap-3">
                        <input
                            id="material-visibility"
                            type="checkbox"
                            checked={visibility}
                            onChange={(event) => setVisibility(event.target.checked)}
                            className="size-4 rounded border-input accent-primary"
                        />
                        <Label htmlFor="material-visibility">Visible to students</Label>
                    </div>
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
