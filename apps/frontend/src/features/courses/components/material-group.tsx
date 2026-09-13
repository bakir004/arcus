import { memo, useCallback, useEffect, useState, type HTMLAttributes } from 'react';
import { ClipboardList, ChevronDown, GripVertical } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Group } from '@/components/common';
import type { CourseMaterial, MaterialGroup } from '../api/get-course-materials';
import { useMoveCourseMaterial } from '../api/move-course-material';
import { toast } from 'sonner';
import { title } from './material-utils';
import { MaterialRow } from './material-row';

function SortableMaterial({
    courseId,
    material,
    groups,
}: {
    courseId: string;
    material: CourseMaterial;
    groups: MaterialGroup[];
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
                    <button
                        type="button"
                        aria-label={`Reorder ${title(material)}`}
                        {...attributes}
                        {...listeners}
                        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    >
                        <GripVertical className="size-4" />
                    </button>
                }
            />
        </div>
    );
}

export function SortableGroupCard({
    courseId,
    group,
    allGroups,
    anchorId,
}: {
    courseId: string;
    group: MaterialGroup;
    allGroups: MaterialGroup[];
    anchorId?: string;
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
                groupDragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

const GroupMaterialList = memo(function GroupMaterialList({
    courseId,
    materials,
    allGroups,
    onDragEnd,
}: {
    courseId: string;
    materials: CourseMaterial[];
    allGroups: MaterialGroup[];
    onDragEnd: (event: DragEndEvent) => void;
}) {
    const sensors = useSensors(useSensor(PointerSensor));
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={materials.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-border border-t border-border">
                    {materials.length ? (
                        materials.map((material) => (
                            <SortableMaterial
                                key={material.id}
                                courseId={courseId}
                                material={material}
                                groups={allGroups}
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
}: {
    courseId: string;
    group: MaterialGroup;
    allGroups: MaterialGroup[];
    anchorId?: string;
    groupDragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
    const [materials, setMaterials] = useState(group.materials);
    const [collapsed, setCollapsed] = useState(false);
    const { mutateAsync: moveMaterial } = useMoveCourseMaterial();
    useEffect(() => setMaterials(group.materials), [group.materials]);
    const reorder = useCallback(
        ({ active, over }: DragEndEvent) => {
            if (!over || active.id === over.id) return;
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
        [courseId, group.id, materials, moveMaterial],
    );
    return (
        <section
            id={anchorId}
            data-group-id={group.id}
            data-group-name={group.name}
            className="scroll-mt-24 overflow-hidden rounded-lg border border-border bg-card"
        >
            <Group
                gap={4}
                className="cursor-pointer px-5 py-5 transition-colors hover:bg-muted/50"
                onClick={() => setCollapsed((value) => !value)}
            >
                <button
                    type="button"
                    {...groupDragHandleProps}
                    aria-label={`Drag ${group.name}`}
                    className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    onClick={(event) => event.stopPropagation()}
                >
                    <GripVertical className="size-4" />
                </button>
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
                    {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
                </div>
                <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? '-rotate-90' : ''}`}
                />
            </Group>
            {!collapsed && (
                <GroupMaterialList
                    courseId={courseId}
                    materials={materials}
                    allGroups={allGroups}
                    onDragEnd={reorder}
                />
            )}
        </section>
    );
}
