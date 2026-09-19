import { memo, useCallback, useEffect, useState, type HTMLAttributes } from 'react';
import { CalendarDays, ClipboardList, ChevronDown, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Group } from '@/components/common';
import type { CourseMaterial, MaterialGroup } from '../api/get-course-materials';
import { useMoveCourseMaterial } from '../api/move-course-material';
import { useDeleteCourseMaterialGroup } from '../api/delete-course-material-group';
import { toast } from 'sonner';
import { title } from './material-utils';
import { MaterialRow } from './material-row';
import { EditCourseMaterialGroupDialog } from './course-material-dialogs';
import { DeleteCourseMaterialGroupDialog } from './delete-course-material-group-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function SortableMaterial({
    courseId,
    material,
    groups,
    canManage,
}: {
    courseId: string;
    material: CourseMaterial;
    groups: MaterialGroup[];
    canManage: boolean;
}) {
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
                groups={groups}
                dragHandle={
                    canManage ? (
                        <button
                            type="button"
                            aria-label={`Reorder ${title(material)}`}
                            {...attributes}
                            {...listeners}
                            className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        >
                            <GripVertical className="size-4" />
                        </button>
                    ) : null
                }
                canManage={canManage}
            />
        </div>
    );
}

export function SortableGroupCard({
    courseId,
    group,
    allGroups,
    anchorId,
    canManage,
}: {
    courseId: string;
    group: MaterialGroup;
    allGroups: MaterialGroup[];
    anchorId?: string;
    canManage: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
                transition: isDragging ? undefined : transition,
            }}
            className={isDragging ? 'relative z-10 opacity-70' : undefined}
        >
            <GroupCard
                courseId={courseId}
                group={group}
                allGroups={allGroups}
                anchorId={anchorId}
                canManage={canManage}
                groupDragHandleProps={canManage ? { ...attributes, ...listeners } : undefined}
            />
        </div>
    );
}

function formatWeekRange(weekStartDate: string) {
    const start = new Date(`${weekStartDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const format = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${format(start)} - ${format(end)}`;
}

const GroupMaterialList = memo(function GroupMaterialList({
    courseId,
    materials,
    allGroups,
    onDragEnd,
    canManage,
    showHeader,
}: {
    courseId: string;
    materials: CourseMaterial[];
    allGroups: MaterialGroup[];
    onDragEnd: (event: DragEndEvent) => void;
    canManage: boolean;
    showHeader: boolean;
}) {
    const sensors = useSensors(useSensor(PointerSensor));
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={canManage ? onDragEnd : undefined}>
            <SortableContext items={materials.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div
                    className={showHeader ? 'divide-y divide-border border-t border-border' : 'divide-y divide-border'}
                >
                    {materials.length ? (
                        materials.map((material) => (
                            <SortableMaterial
                                key={material.id}
                                courseId={courseId}
                                material={material}
                                groups={allGroups}
                                canManage={canManage}
                            />
                        ))
                    ) : (
                        <p className="px-5 py-6 text-sm text-muted-foreground">This group currently has no elements</p>
                    )}
                </div>
            </SortableContext>
        </DndContext>
    );
});

function GroupCard({
    courseId,
    group,
    allGroups,
    anchorId,
    groupDragHandleProps,
    canManage,
}: {
    courseId: string;
    group: MaterialGroup;
    allGroups: MaterialGroup[];
    anchorId?: string;
    groupDragHandleProps?: HTMLAttributes<HTMLButtonElement>;
    canManage: boolean;
}) {
    const [materials, setMaterials] = useState(group.materials);
    const [collapsed, setCollapsed] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const isLabeled = group.labeled;
    const { mutateAsync: moveMaterial } = useMoveCourseMaterial();
    const deleteGroup = useDeleteCourseMaterialGroup();
    useEffect(() => setMaterials(group.materials), [group.materials]);
    const reorder = useCallback(
        ({ active, over }: DragEndEvent) => {
            if (!canManage || !over || active.id === over.id) return;
            const oldIndex = materials.findIndex((item) => item.id === active.id);
            const newIndex = materials.findIndex((item) => item.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return;
            setMaterials((current) => arrayMove(current, oldIndex, newIndex));
            void moveMaterial({
                courseId,
                materialId: String(active.id),
                groupId: group.id,
                position: newIndex,
            }).catch(() => toast.error('Failed to save material order.'));
        },
        [canManage, courseId, group.id, materials, moveMaterial],
    );
    return (
        <section
            id={anchorId}
            data-group-id={group.id}
            data-group-name={group.name}
            className="scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card"
        >
            {(isLabeled || canManage) && (
                <Group
                    gap={4}
                    className={isLabeled ? 'cursor-pointer px-5 py-5 transition-colors hover:bg-muted/50' : 'px-5 py-2'}
                    onClick={isLabeled ? () => setCollapsed((value) => !value) : undefined}
                >
                    {canManage && (
                        <button
                            type="button"
                            {...groupDragHandleProps}
                            aria-label={`Drag ${group.name}`}
                            className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <GripVertical className="size-4" />
                        </button>
                    )}
                    {isLabeled ? (
                        <>
                            <Box className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <ClipboardList className="size-5" />
                            </Box>
                            <div className="min-w-0 flex-1">
                                <Group gap={2}>
                                    <h2 className="truncate font-semibold">{group.name}</h2>
                                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                        {materials.length} {materials.length === 1 ? 'item' : 'items'}
                                    </span>
                                </Group>
                                {group.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                                )}
                            </div>
                            {group.weekStartDate && (
                                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                                    <CalendarDays className="size-4" />
                                    {formatWeekRange(group.weekStartDate)}
                                </span>
                            )}
                            <ChevronDown
                                className={`size-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? '-rotate-90' : ''}`}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        hidden={!canManage}
                                        aria-label={`Actions for ${group.name}`}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <MoreVertical className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                        <Pencil /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                                        <Trash2 /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <h2 className="min-w-0 flex-1 truncate text-sm italic text-muted-foreground">
                                {group.name}
                            </h2>
                            {group.weekStartDate && (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <CalendarDays className="size-4" />
                                    {formatWeekRange(group.weekStartDate)}
                                </span>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        hidden={!canManage}
                                        aria-label={`Actions for ${group.name}`}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <MoreVertical className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                        <Pencil /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                                        <Trash2 /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </Group>
            )}
            <EditCourseMaterialGroupDialog
                courseId={courseId}
                group={group}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DeleteCourseMaterialGroupDialog
                name={group.name}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                pending={deleteGroup.isPending}
                onConfirm={() => {
                    void deleteGroup
                        .mutateAsync({ courseId, groupId: group.id })
                        .then(() => setDeleteOpen(false))
                        .catch(() => toast.error('Failed to delete material group.'));
                }}
            />
            {(!isLabeled || !collapsed) && (
                <GroupMaterialList
                    courseId={courseId}
                    materials={materials}
                    allGroups={allGroups}
                    onDragEnd={reorder}
                    canManage={canManage}
                    showHeader={isLabeled || canManage}
                />
            )}
        </section>
    );
}
