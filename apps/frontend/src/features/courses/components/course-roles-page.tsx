import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Group } from '@/components/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import { useGetCourseByCode } from '../api/get-course';
import {
    useAssignCourseMemberRole,
    useCourseMembers,
    useCoursePermissions,
    useCourseRoles,
    useCreateCourseRole,
    useDeleteCourseRole,
    useRenameCourseRole,
    useUpdateCourseRole,
} from '../api/get-course-roles';

function getInitials(name: string, email: string) {
    const source = name.trim() || email.trim() || 'U';
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export function CourseRolesPage({ courseCode }: { courseCode: string }) {
    const { data: course } = useGetCourseByCode(courseCode);
    const courseId = course?.id ?? '';
    const { data: roles = [], isLoading: rolesLoading } = useCourseRoles(courseId);
    const { data: permissions = [] } = useCoursePermissions(courseId);
    const { data: members = [], isLoading: membersLoading } = useCourseMembers(courseId);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [manageRolesOpen, setManageRolesOpen] = useState(false);
    const [roleManagementOpen, setRoleManagementOpen] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [editingRoleName, setEditingRoleName] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const selectedRole = roles.find((role) => role.id === selectedRoleId);
    const isProtectedRole = ['professor', 'student'].includes(selectedRole?.name.toLowerCase() ?? '');
    const updateRole = useUpdateCourseRole(courseId);
    const createRole = useCreateCourseRole(courseId);
    const renameRole = useRenameCourseRole(courseId);
    const deleteRole = useDeleteCourseRole(courseId);
    const assignRole = useAssignCourseMemberRole(courseId);

    useEffect(() => {
        if (!selectedRoleId && roles[0]) setSelectedRoleId(roles[0].id);
    }, [roles, selectedRoleId]);

    useEffect(() => {
        setSelectedPermissions(selectedRole?.permissions ?? []);
    }, [selectedRole]);

    const debouncedMemberSearch = useDebounce(memberSearch);
    const isMemberSearchPending = memberSearch !== debouncedMemberSearch;
    const filteredMembers = useMemo(() => {
        const search = debouncedMemberSearch.trim().toLowerCase();
        if (!search) return [];
        return members
            .filter((member) => {
                const emailLocalPart = member.email.split('@')[0] ?? '';
                return member.name.toLowerCase().includes(search) || emailLocalPart.toLowerCase().includes(search);
            })
            .slice(0, 10);
    }, [debouncedMemberSearch, members]);

    const nonStudentMembers = useMemo(
        () => members.filter((member) => !member.roles.some((role) => role.name.toLowerCase() === 'student')),
        [members],
    );

    const permissionGroups = useMemo(() => {
        return permissions.reduce<Record<string, string[]>>((groups, permission) => {
            const [group] = permission.split(':');
            if (!groups[group]) groups[group] = [];
            groups[group].push(permission);
            return groups;
        }, {});
    }, [permissions]);

    const updatePermissions = async (nextPermissions: string[], previousPermissions: string[]) => {
        if (!selectedRole || isProtectedRole || updateRole.isPending) return;
        setSelectedPermissions(nextPermissions);

        const request = updateRole.mutateAsync({ roleId: selectedRole.id, permissions: nextPermissions });
        toast.promise(request, {
            loading: 'Updating role permissions…',
            success: 'Role permissions updated.',
            error: 'Could not update role permissions.',
        });

        try {
            await request;
        } catch {
            setSelectedPermissions(previousPermissions);
        }
    };

    const togglePermission = (permission: string) => {
        const previousPermissions = selectedPermissions;
        const nextPermissions = previousPermissions.includes(permission)
            ? previousPermissions.filter((item) => item !== permission)
            : [...previousPermissions, permission];
        void updatePermissions(nextPermissions, previousPermissions);
    };

    const togglePermissionGroup = (groupPermissions: string[]) => {
        const previousPermissions = selectedPermissions;
        const allSelected = groupPermissions.every((permission) => previousPermissions.includes(permission));
        const nextPermissions = allSelected
            ? previousPermissions.filter((permission) => !groupPermissions.includes(permission))
            : [...new Set([...previousPermissions, ...groupPermissions])];
        void updatePermissions(nextPermissions, previousPermissions);
    };

    const addRole = async () => {
        const name = newRoleName.trim();
        if (!name) return;
        try {
            const role = await createRole.mutateAsync({ name, permissions: [] });
            setNewRoleName('');
            setSelectedRoleId(role.id);
            setRoleManagementOpen(false);
            toast.success('Role created.');
        } catch {
            toast.error('Could not create role.');
        }
    };

    const startRename = (roleId: string, name: string) => {
        setEditingRoleId(roleId);
        setEditingRoleName(name);
    };

    const saveRoleName = async () => {
        if (!editingRoleId || !editingRoleName.trim()) return;
        try {
            await renameRole.mutateAsync({ roleId: editingRoleId, name: editingRoleName.trim() });
            setEditingRoleId(null);
            toast.success('Role renamed.');
        } catch {
            toast.error('Could not rename role.');
        }
    };

    const removeRole = async (roleId: string) => {
        try {
            await deleteRole.mutateAsync(roleId);
            if (selectedRoleId === roleId) setSelectedRoleId(roles.find((role) => role.id !== roleId)?.id ?? '');
            toast.success('Role deleted.');
        } catch {
            toast.error('Could not delete role. Make sure no users are assigned to it.');
        }
    };

    const changeMemberRole = (memberId: string, roleId: string) => {
        const request = assignRole.mutateAsync({ memberId, roleId });
        toast.promise(request, {
            loading: 'Updating member role…',
            success: 'Member role updated.',
            error: 'Could not update member role.',
        });
    };

    if (!course) return <p className="text-muted-foreground">Loading course…</p>;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Course roles</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage roles, permissions, and enrolled users.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {nonStudentMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
                    >
                        <Avatar className="size-9 shrink-0">
                            <AvatarImage
                                src={member.image ?? undefined}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                            />
                            <AvatarFallback>{getInitials(member.name, member.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                            <p className="truncate text-xs text-muted-foreground">
                                {member.roles.map((role) => role.name).join(', ') || 'No role'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
                <Group className="items-end justify-between gap-4" wrap>
                    <div className="min-w-64 flex-1 space-y-2">
                        <Label htmlFor="role-select">Role</Label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={rolesLoading}>
                            <SelectTrigger id="role-select">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                        {['student', 'professor'].includes(role.name.toLowerCase()) ? (
                                            <span className="ml-1 italic text-muted-foreground">(readonly)</span>
                                        ) : null}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Popover open={roleManagementOpen} onOpenChange={setRoleManagementOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline">
                                <Plus />
                                Manage roles
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-96">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Available roles</p>
                                    <p className="text-xs text-muted-foreground">Rename or delete course roles.</p>
                                </div>
                                <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
                                    {roles.map((role) => {
                                        const hasAssignedUsers = members.some((member) =>
                                            member.roles.some((memberRole) => memberRole.id === role.id),
                                        );
                                        const deleteButton = (
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant="ghost"
                                                className="text-destructive"
                                                disabled={hasAssignedUsers || deleteRole.isPending}
                                                onClick={() => void removeRole(role.id)}
                                            >
                                                Delete
                                            </Button>
                                        );
                                        return (
                                            <div key={role.id} className="rounded-md border px-2 py-1">
                                                <Group className="items-center justify-between gap-1">
                                                    <span className="min-w-0 truncate text-xs">{role.name}</span>
                                                    <Group className="shrink-0 gap-1">
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => startRename(role.id, role.name)}
                                                        >
                                                            Rename
                                                        </Button>
                                                        {hasAssignedUsers ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span tabIndex={0}>{deleteButton}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    There are users with this role. Reassign their roles
                                                                    first before deleting.
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            deleteButton
                                                        )}
                                                    </Group>
                                                </Group>
                                                {editingRoleId === role.id ? (
                                                    <form
                                                        className="mt-1 flex gap-1"
                                                        onSubmit={(event) => {
                                                            event.preventDefault();
                                                            void saveRoleName();
                                                        }}
                                                    >
                                                        <Input
                                                            value={editingRoleName}
                                                            onChange={(event) => setEditingRoleName(event.target.value)}
                                                            className="text-sm"
                                                            autoFocus
                                                        />
                                                        <Button type="submit" size="sm" disabled={renameRole.isPending}>
                                                            Save
                                                        </Button>
                                                    </form>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                                <form
                                    className="space-y-3 border-t pt-3"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void addRole();
                                    }}
                                >
                                    <Label htmlFor="new-role-name">Add role</Label>
                                    <Input
                                        id="new-role-name"
                                        value={newRoleName}
                                        onChange={(event) => setNewRoleName(event.target.value)}
                                        placeholder="e.g. Teaching assistant"
                                        className="text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={createRole.isPending || !newRoleName.trim()}
                                    >
                                        Create role
                                    </Button>
                                </form>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover open={manageRolesOpen} onOpenChange={setManageRolesOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="secondary">
                                <Search />
                                Manage users
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-[26rem] p-0">
                            <div className="border-b p-3">
                                <Input
                                    value={memberSearch}
                                    onChange={(event) => setMemberSearch(event.target.value)}
                                    placeholder="Search enrolled students…"
                                    aria-label="Search enrolled students"
                                    className="text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="scrollbar-thin max-h-80 overflow-y-auto">
                                {membersLoading ? (
                                    <p className="p-4 text-sm text-muted-foreground">Loading enrolled users…</p>
                                ) : isMemberSearchPending ? (
                                    <p className="p-4 text-sm text-muted-foreground">Searching…</p>
                                ) : !debouncedMemberSearch.trim() ? (
                                    <p className="p-4 text-sm text-muted-foreground">Type to search enrolled users.</p>
                                ) : filteredMembers.length === 0 ? (
                                    <p className="p-4 text-sm text-muted-foreground">No matching enrolled users.</p>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"
                                        >
                                            <Group className="min-w-0 gap-2">
                                                <Avatar className="size-8 shrink-0">
                                                    <AvatarImage
                                                        src={member.image ?? undefined}
                                                        alt={member.name}
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <AvatarFallback>
                                                        {getInitials(member.name, member.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{member.name}</p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </Group>
                                            <Select
                                                value={member.roles[0]?.id ?? ''}
                                                onValueChange={(roleId) => changeMemberRole(member.id, roleId)}
                                                disabled={assignRole.isPending}
                                            >
                                                <SelectTrigger className="w-36 shrink-0">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </Group>

                <div className="mt-6 border-t pt-6">
                    <Group className="mb-4 items-center justify-between">
                        <div>
                            <h2 className="font-medium">Permissions{selectedRole ? ` · ${selectedRole.name}` : ''}</h2>
                            <p className="text-sm text-muted-foreground">
                                {isProtectedRole
                                    ? 'This built-in role has read-only permissions.'
                                    : 'Choose what this role can do in the course.'}
                            </p>
                        </div>
                    </Group>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(permissionGroups).map(([group, groupPermissions]) => {
                            const allGroupSelected = groupPermissions.every((permission) =>
                                selectedPermissions.includes(permission),
                            );
                            return (
                                <div key={group} className="space-y-2">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium capitalize">
                                        <input
                                            type="checkbox"
                                            checked={allGroupSelected}
                                            onChange={() => togglePermissionGroup(groupPermissions)}
                                            disabled={!selectedRole || isProtectedRole || updateRole.isPending}
                                            className="size-4 accent-primary"
                                        />
                                        <span>{group}</span>
                                    </label>
                                    {groupPermissions.map((permission) => (
                                        <label
                                            key={permission}
                                            className="flex cursor-pointer items-center gap-2 pl-5 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(permission)}
                                                onChange={() => void togglePermission(permission)}
                                                disabled={!selectedRole || isProtectedRole || updateRole.isPending}
                                                className="size-4 accent-primary"
                                            />
                                            <span>{permission}</span>
                                        </label>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
