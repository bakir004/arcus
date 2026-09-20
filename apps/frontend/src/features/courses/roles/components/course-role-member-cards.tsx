import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CourseMember } from '../api/get-course-roles';

export function getInitials(name: string, email: string) {
    const source = name.trim() || email.trim() || 'U';
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export function CourseRoleMemberCards({ members }: { members: CourseMember[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
                >
                    <Avatar className="size-9 shrink-0">
                        <AvatarImage src={member.image ?? undefined} alt={member.name} referrerPolicy="no-referrer" />
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
    );
}
