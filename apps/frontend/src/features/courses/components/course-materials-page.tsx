import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Box } from '@/components/common';
import { useGetCourseMaterials } from '../api/get-course-materials';
import { useGetCourseByCode } from '../api/get-course';
import { useGetCourseMe } from '../api/get-course-me';
import { useMoveCourseMaterialGroup } from '../api/move-course-material-group';
import { SortableGroupCard } from './material-group';
import { CreateCourseMaterialDialog, CreateCourseMaterialGroupDialog } from './course-material-dialogs';
import { groupAnchor, scrollToGroup, title } from './material-utils';

export function CourseMaterialsPage() {
    const { code } = useParams({ from: '/courses/$code/materials' });
    const { data: course, isLoading: courseLoading } = useGetCourseByCode(code);
    const { data: content, isLoading, isError } = useGetCourseMaterials(course?.id ?? '');
    const { data: courseMe } = useGetCourseMe(course?.id ?? '');
    const [search, setSearch] = useState('');
    const [scrollTarget, setScrollTarget] = useState<string | null | undefined>();
    const materialGroups = content ?? [];
    const canCreateMaterial = courseMe?.permissions.includes('course:material:create') ?? false;
    const moveGroup = useMoveCourseMaterialGroup();
    const queryClient = useQueryClient();
    const groupSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));
    const groups = useMemo(() => {
        const q = search.toLowerCase().trim();
        return (content ?? [])
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
    }, [groups, search]);
    const displayedGroups = search.trim() ? groups : orderedGroups.length ? orderedGroups : groups;
    const reorderGroups = (activeId: string, overId: string) => {
        if (activeId === overId || search.trim()) return;
        const oldIndex = displayedGroups.findIndex(({ group }) => group.id === activeId);
        const newIndex = displayedGroups.findIndex(({ group }) => group.id === overId);
        if (oldIndex < 0 || newIndex < 0) return;
        setOrderedGroups((current) => arrayMove(current, oldIndex, newIndex));
        void moveGroup.mutateAsync({ courseId: course?.id ?? '', groupId: activeId, position: newIndex }).catch(() => {
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
        <Box as="main" id="top" className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-10">
            <Box className="min-w-0 flex-1">
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
                        <DndContext
                            sensors={groupSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleGroupDragEnd}
                        >
                            <SortableContext
                                items={displayedGroups.map(({ group }) => group.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {displayedGroups.map(({ group }, index) => (
                                    <SortableGroupCard
                                        key={group.id}
                                        courseId={course.id}
                                        group={group}
                                        allGroups={materialGroups}
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
                        <button
                            type="button"
                            onClick={() =>
                                document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                            className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            Top
                        </button>
                        {displayedGroups.map(({ group }, index) => (
                            <button
                                type="button"
                                key={group.id}
                                onClick={() => scrollToGroup(groupAnchor(group, index))}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                {group.name}
                            </button>
                        ))}
                    </nav>
                </Box>
            </Box>
        </Box>
    );
}
