import { Link } from '@tanstack/react-router';
import {
    ArrowRightIcon,
    BarChart3Icon,
    BookOpenIcon,
    CheckCircle2Icon,
    ClipboardCheckIcon,
    FilePlus2Icon,
    MegaphoneIcon,
    MoreHorizontalIcon,
    PlusIcon,
    UsersIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth/lib/use-auth';

const courses = [
    { name: 'Programming 2', code: 'CS-202', students: 86, completion: 78, color: 'bg-primary' },
    { name: 'Algorithms', code: 'CS-301', students: 64, completion: 64, color: 'bg-tertiary' },
    { name: 'Computer Networks', code: 'CS-305', students: 48, completion: 91, color: 'bg-success' },
];

const gradingQueue = [
    { title: 'Pointers and memory', course: 'Programming 2', count: 18, due: 'Due today' },
    { title: 'Graph traversal', course: 'Algorithms', count: 11, due: 'Due tomorrow' },
    { title: 'Network design report', course: 'Computer Networks', count: 7, due: 'Due Mar 14' },
];

function DashboardCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm ${className}`}>
            {children}
        </section>
    );
}

export function ProfessorDashboard() {
    const { user } = useAuth();

    return (
        <main className="min-h-full bg-muted/20 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border/70 bg-card px-6 py-7 shadow-sm sm:flex-row sm:items-end sm:px-8">
                    <div>
                        <p className="mb-2 text-sm font-medium text-primary">Teaching overview</p>
                        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
                            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                            Here is what needs your attention across your courses today.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <MegaphoneIcon className="size-4" /> Announce
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                        >
                            <PlusIcon className="size-4" /> New assignment
                        </button>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'Active courses',
                            value: '3',
                            detail: 'This semester',
                            icon: BookOpenIcon,
                            color: 'bg-primary/10 text-primary',
                        },
                        {
                            label: 'Total students',
                            value: '198',
                            detail: '+12 since last term',
                            icon: UsersIcon,
                            color: 'bg-tertiary/10 text-tertiary',
                        },
                        {
                            label: 'To grade',
                            value: '36',
                            detail: 'Across 3 assignments',
                            icon: ClipboardCheckIcon,
                            color: 'bg-warning/15 text-warning-foreground',
                        },
                        {
                            label: 'Avg. engagement',
                            value: '84%',
                            detail: '+6% this month',
                            icon: BarChart3Icon,
                            color: 'bg-success/10 text-success',
                        },
                    ].map((stat) => (
                        <DashboardCard key={stat.label} className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{stat.detail}</p>
                                </div>
                                <div className={`flex size-9 items-center justify-center rounded-lg ${stat.color}`}>
                                    <stat.icon className="size-4" />
                                </div>
                            </div>
                        </DashboardCard>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <DashboardCard>
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <BookOpenIcon className="size-4 text-primary" /> Course pulse
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Completion of current course work</p>
                            </div>
                            <MoreHorizontalIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-5">
                            {courses.map((course) => (
                                <div key={course.code}>
                                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{course.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {course.code} · {course.students} students
                                            </p>
                                        </div>
                                        <span className="font-semibold">{course.completion}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${course.color}`}
                                            style={{ width: `${course.completion}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            to="/"
                            className="mt-5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            Manage courses <ArrowRightIcon className="size-3" />
                        </Link>
                    </DashboardCard>

                    <DashboardCard>
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <ClipboardCheckIcon className="size-4 text-primary" /> Grading queue
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Submissions waiting for feedback</p>
                            </div>
                            <span className="rounded-full bg-warning/15 px-2 py-1 text-[11px] font-semibold text-warning-foreground">
                                36 pending
                            </span>
                        </div>
                        <div className="divide-y divide-border/60">
                            {gradingQueue.map((item) => (
                                <div key={item.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <FilePlus2Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{item.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {item.course} · {item.due}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold">{item.count}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="mt-5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            Open grading queue <ArrowRightIcon className="size-3" />
                        </button>
                    </DashboardCard>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <DashboardCard>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <CheckCircle2Icon className="size-4 text-success" /> Teaching checklist
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Small actions that keep courses moving
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[
                                'Review 18 Programming 2 submissions',
                                'Publish the Algorithms study guide',
                                'Send a reminder about the network report',
                            ].map((task, index) => (
                                <label
                                    key={task}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-sm transition-colors hover:bg-muted/60"
                                >
                                    <input
                                        type="checkbox"
                                        defaultChecked={index === 0}
                                        className="size-4 accent-primary"
                                    />
                                    <span className={index === 0 ? 'text-muted-foreground line-through' : ''}>
                                        {task}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </DashboardCard>
                    <DashboardCard>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <MegaphoneIcon className="size-4 text-primary" /> Recent announcements
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">What your students have seen</p>
                            </div>
                            <button type="button" className="text-xs font-medium text-primary hover:underline">
                                View all
                            </button>
                        </div>
                        <div className="space-y-3">
                            <article className="rounded-xl bg-muted/50 p-3">
                                <p className="text-sm font-medium">Midterm review session added</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Algorithms · Posted yesterday · 64 views
                                </p>
                            </article>
                            <article className="rounded-xl bg-muted/50 p-3">
                                <p className="text-sm font-medium">Network report rubric updated</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Computer Networks · Posted Mar 7 · 39 views
                                </p>
                            </article>
                        </div>
                    </DashboardCard>
                </div>
            </div>
        </main>
    );
}
