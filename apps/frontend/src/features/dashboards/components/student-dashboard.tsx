import { Link } from '@tanstack/react-router';
import {
    ArrowRightIcon,
    BellIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    CheckCircle2Icon,
    Clock3Icon,
    FileTextIcon,
    MoreHorizontalIcon,
    SparklesIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth/lib/use-auth';

const assignments = [
    {
        title: 'Pointers and memory',
        course: 'Programming 2',
        due: 'Today, 23:59',
        tone: 'urgent',
        progress: 'Not started',
    },
    {
        title: 'Database normalization',
        course: 'Databases',
        due: 'Tomorrow, 18:00',
        tone: 'soon',
        progress: 'In progress',
    },
    {
        title: 'Read chapter 4 and annotate',
        course: 'Computer Networks',
        due: 'Thu, 12 Mar',
        tone: 'normal',
        progress: 'Not started',
    },
    {
        title: 'Midterm preparation quiz',
        course: 'Algorithms',
        due: 'Fri, 13 Mar',
        tone: 'normal',
        progress: 'Not started',
    },
];

const announcements = [
    { title: 'Library hours extended during midterms', course: 'Arcus community', age: '2 hours ago' },
    { title: 'New feedback on your sorting assignment', course: 'Algorithms', age: 'Yesterday' },
    { title: 'Guest lecture: Building reliable systems', course: 'Computer Networks', age: 'Mar 7' },
];

function getWeek() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        return {
            date,
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            number: date.getDate(),
            isToday: index === 0,
            hasDeadline: [0, 1, 3, 5].includes(index),
        };
    });
}

function getGreeting(name: string | undefined) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}${name ? `, ${name.split(' ')[0]}` : ''}`;
}

function DashboardCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm ${className}`}>
            {children}
        </section>
    );
}

export function StudentDashboard() {
    const { user } = useAuth();
    const week = getWeek();

    return (
        <main className="min-h-full bg-muted/20 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-sm sm:px-8">
                    <div className="relative z-10 max-w-2xl">
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary-foreground/75">
                            <SparklesIcon className="size-4" /> Your learning overview
                        </p>
                        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{getGreeting(user?.name)}</h1>
                        <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/80">
                            Keep your momentum going. You have two deadlines coming up in the next 48 hours.
                        </p>
                    </div>
                    <div className="absolute -right-12 -top-20 size-64 rounded-full border-[28px] border-primary-foreground/10" />
                    <div className="absolute -bottom-24 right-24 size-48 rounded-full border-[18px] border-primary-foreground/10" />
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <DashboardCard>
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <CalendarDaysIcon className="size-4 text-primary" /> This week
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Your deadlines at a glance</p>
                            </div>
                            <button type="button" className="text-xs font-medium text-primary hover:underline">
                                Open calendar
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {week.map((day) => (
                                <div
                                    key={day.date.toISOString()}
                                    className={`flex min-h-24 flex-col items-center rounded-xl border p-2 ${day.isToday ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/45'}`}
                                >
                                    <span
                                        className={`text-[11px] font-medium ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}
                                    >
                                        {day.day}
                                    </span>
                                    <span
                                        className={`mt-2 flex size-8 items-center justify-center rounded-full text-sm font-semibold ${day.isToday ? 'bg-primary text-primary-foreground' : ''}`}
                                    >
                                        {day.number}
                                    </span>
                                    <span
                                        className="mt-auto flex h-4 items-center gap-0.5"
                                        role="img"
                                        aria-label={day.hasDeadline ? 'Has deadline' : 'No deadlines'}
                                    >
                                        {day.hasDeadline ? (
                                            <span className="size-1.5 rounded-full bg-primary" />
                                        ) : (
                                            <span className="size-1.5 rounded-full bg-border" />
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>

                    <DashboardCard>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <CheckCircle2Icon className="size-4 text-success" /> Your progress
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">A quick pulse on your semester</p>
                            </div>
                            <MoreHorizontalIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-5">
                            <div
                                className="relative flex size-24 items-center justify-center rounded-full"
                                style={{ background: 'conic-gradient(var(--primary) 72%, var(--muted) 72%)' }}
                            >
                                <div className="flex size-16 items-center justify-center rounded-full bg-card text-xl font-semibold">
                                    72<span className="text-xs">%</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-xs">
                                <p>
                                    <span className="mr-2 inline-block size-2 rounded-full bg-primary" /> 18 completed
                                </p>
                                <p>
                                    <span className="mr-2 inline-block size-2 rounded-full bg-muted" /> 7 remaining
                                </p>
                                <p className="pt-1 font-medium text-success">On track this week</p>
                            </div>
                        </div>
                    </DashboardCard>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                    <DashboardCard>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <FileTextIcon className="size-4 text-primary" /> Upcoming assignments
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Sorted by due date</p>
                            </div>
                            <Link
                                to="/"
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                                View all <ArrowRightIcon className="size-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-border/60">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.title}
                                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                                >
                                    <div
                                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${assignment.tone === 'urgent' ? 'bg-destructive/10 text-destructive' : assignment.tone === 'soon' ? 'bg-warning/15 text-warning-foreground' : 'bg-primary/10 text-primary'}`}
                                    >
                                        <BookOpenIcon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{assignment.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {assignment.course} · {assignment.progress}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p
                                            className={`text-xs font-medium ${assignment.tone === 'urgent' ? 'text-destructive' : ''}`}
                                        >
                                            {assignment.due}
                                        </p>
                                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                                            <Clock3Icon className="size-3" /> Due date
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>

                    <DashboardCard>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                    <BellIcon className="size-4 text-primary" /> Recent announcements
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Stay in the loop</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                3 new
                            </span>
                        </div>
                        <div className="space-y-1">
                            {announcements.map((announcement) => (
                                <article
                                    key={announcement.title}
                                    className="rounded-xl p-3 transition-colors hover:bg-muted/60"
                                >
                                    <p className="text-sm font-medium leading-5">{announcement.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {announcement.course} · {announcement.age}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </DashboardCard>
                </div>
            </div>
        </main>
    );
}
