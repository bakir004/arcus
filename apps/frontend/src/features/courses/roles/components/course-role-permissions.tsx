import { Group } from '@/components/common';
import type { CourseRole } from '../api/get-course-roles';

export function CourseRolePermissions({
    role,
    permissionGroups,
    selectedPermissions,
    protectedRole,
    pending,
    onToggle,
    onToggleGroup,
}: {
    role: CourseRole | undefined;
    permissionGroups: Record<string, string[]>;
    selectedPermissions: string[];
    protectedRole: boolean;
    pending: boolean;
    onToggle: (permission: string) => void;
    onToggleGroup: (permissions: string[]) => void;
}) {
    return (
        <div className="mt-6 border-t pt-6">
            <Group className="mb-4 items-center justify-between">
                <div>
                    <h2 className="font-medium">Permissions{role ? ` · ${role.name}` : ''}</h2>
                    <p className="text-sm text-muted-foreground">
                        {protectedRole
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
                                    onChange={() => onToggleGroup(groupPermissions)}
                                    disabled={!role || protectedRole || pending}
                                    className="size-4 accent-primary"
                                />
                                <span>{group}</span>
                            </label>
                            {groupPermissions.map((permission) => (
                                <label key={permission} className="flex cursor-pointer items-center gap-2 pl-5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(permission)}
                                        onChange={() => onToggle(permission)}
                                        disabled={!role || protectedRole || pending}
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
    );
}
