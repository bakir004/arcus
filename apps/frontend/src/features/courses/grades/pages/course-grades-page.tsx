import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import {
    AlertTriangle,
    CalendarDays,
    Check,
    ChevronRight,
    Clock3,
    Download,
    FileText,
    MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetCourseByCode } from '../../api/get-course';

type AssessmentStatus = 'graded' | 'submitted' | 'open' | 'upcoming';
type Assessment = {
    id: string;
    category: 'Assignments' | 'Labs' | 'Quizzes' | 'Exams';
    name: string;
    topic: string;
    week: number;
    max: number;
    score?: number;
    average?: number;
    status: AssessmentStatus;
    statusLabel?: string;
    feedback?: string;
};

const assessments: Assessment[] = [
    {
        id: 'a1',
        category: 'Assignments',
        name: 'Assignment 1',
        topic: 'Linked lists',
        week: 2,
        max: 3,
        score: 2.7,
        average: 2.4,
        status: 'graded',
        feedback: 'Clean implementation. Review the empty-list edge case.',
    },
    {
        id: 'a2',
        category: 'Assignments',
        name: 'Assignment 2',
        topic: 'Recursion',
        week: 4,
        max: 3,
        score: 2.4,
        average: 2.2,
        status: 'graded',
        feedback: 'Correct result; there is still room to improve the time complexity.',
    },
    {
        id: 'a3',
        category: 'Assignments',
        name: 'Assignment 3',
        topic: 'Binary search trees',
        week: 6,
        max: 3,
        score: 3,
        average: 2.6,
        status: 'graded',
        feedback: 'Full marks and strong test coverage.',
    },
    {
        id: 'a4',
        category: 'Assignments',
        name: 'Assignment 4',
        topic: 'Hash tables',
        week: 8,
        max: 3,
        score: 1.8,
        average: 2.1,
        status: 'graded',
        feedback: 'Duplicate-key collisions need another pass.',
    },
    {
        id: 'a5',
        category: 'Assignments',
        name: 'Assignment 5',
        topic: 'Graph traversal',
        week: 10,
        max: 3,
        status: 'open',
        statusLabel: 'Due in 3 days',
    },
    {
        id: 'l1',
        category: 'Labs',
        name: 'Lab 1',
        topic: 'Measuring complexity',
        week: 1,
        max: 2.5,
        score: 2.5,
        average: 2.2,
        status: 'graded',
        feedback: 'Clear plots and a concise write-up.',
    },
    {
        id: 'l2',
        category: 'Labs',
        name: 'Lab 2',
        topic: 'Linked lists',
        week: 2,
        max: 2.5,
        score: 2,
        average: 2.1,
        status: 'graded',
        feedback: 'The implementation works; remember to free memory on delete.',
    },
    {
        id: 'l3',
        category: 'Labs',
        name: 'Lab 3',
        topic: 'Stacks and queues',
        week: 3,
        max: 2.5,
        score: 2.5,
        average: 2,
        status: 'graded',
        feedback: 'Nested expressions are handled correctly.',
    },
    {
        id: 'l4',
        category: 'Labs',
        name: 'Lab 4',
        topic: 'Recursion',
        week: 4,
        max: 2.5,
        score: 1.5,
        average: 1.9,
        status: 'graded',
        feedback: 'Part two is missing a base case.',
    },
    {
        id: 'l5',
        category: 'Labs',
        name: 'Lab 5',
        topic: 'Tree traversal',
        week: 5,
        max: 2.5,
        score: 2.5,
        average: 2.2,
        status: 'graded',
        feedback: 'All three traversals are correct.',
    },
    {
        id: 'l6',
        category: 'Labs',
        name: 'Lab 6',
        topic: 'BST operations',
        week: 6,
        max: 2.5,
        score: 2,
        average: 2,
        status: 'graded',
        feedback: 'Revisit deletion when the successor has a right child.',
    },
    {
        id: 'l7',
        category: 'Labs',
        name: 'Lab 7',
        topic: 'Hash tables',
        week: 8,
        max: 2.5,
        status: 'submitted',
        statusLabel: 'Awaiting grade',
    },
    {
        id: 'l8',
        category: 'Labs',
        name: 'Lab 8',
        topic: 'Graph search',
        week: 10,
        max: 2.5,
        status: 'upcoming',
        statusLabel: 'Week 10',
    },
    {
        id: 'q1',
        category: 'Quizzes',
        name: 'Quiz 1',
        topic: 'Complexity',
        week: 3,
        max: 2,
        score: 1.5,
        average: 1.4,
        status: 'graded',
        feedback: 'One slip on amortised analysis.',
    },
    {
        id: 'q2',
        category: 'Quizzes',
        name: 'Quiz 2',
        topic: 'Stacks and queues',
        week: 5,
        max: 2,
        score: 2,
        average: 1.5,
        status: 'graded',
        feedback: 'Perfect score.',
    },
    {
        id: 'q3',
        category: 'Quizzes',
        name: 'Quiz 3',
        topic: 'Trees',
        week: 6,
        max: 2,
        score: 1,
        average: 1.3,
        status: 'graded',
        feedback: 'Review pre-order and post-order traversal.',
    },
    {
        id: 'q4',
        category: 'Quizzes',
        name: 'Quiz 4',
        topic: 'Hashing',
        week: 8,
        max: 2,
        score: 1.5,
        average: 1.4,
        status: 'graded',
        feedback: 'The load factor question was missed.',
    },
    {
        id: 'q5',
        category: 'Quizzes',
        name: 'Quiz 5',
        topic: 'Graphs',
        week: 12,
        max: 2,
        status: 'upcoming',
        statusLabel: 'Week 12',
    },
    {
        id: 'mid',
        category: 'Exams',
        name: 'Midterm exam',
        topic: 'Weeks 1–7',
        week: 7,
        max: 20,
        score: 15.5,
        average: 12.9,
        status: 'graded',
        feedback: 'Strong on complexity. Revisit tree rotations.',
    },
    {
        id: 'final',
        category: 'Exams',
        name: 'Final exam',
        topic: 'Whole course',
        week: 15,
        max: 30,
        status: 'upcoming',
        statusLabel: 'Exam period',
    },
];

const categories = ['Assignments', 'Labs', 'Quizzes', 'Exams'] as const;
const gradeBounds = [55, 65, 75, 85, 92];
const courseWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const attendancePoints = 4.1;
const finalMax = 30;
const attendanceRows = [
    { type: 'Lectures', time: 'Mon 10:00 · Hall A2', attended: 7, held: 8, rate: 88 },
    { type: 'Tutorials', time: 'Wed 12:15 · Room B14', attended: 6, held: 7, rate: 86 },
    { type: 'Labs', time: 'Fri 14:00 · Lab 2.14', attended: 6, held: 8, rate: 75 },
];

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const formatPoints = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const gradeFor = (points: number) =>
    points >= 92 ? 10 : points >= 85 ? 9 : points >= 75 ? 8 : points >= 65 ? 7 : points >= 55 ? 6 : 5;

function GradeTrack({ earned, ceiling, projected }: { earned: number; ceiling: number; projected: number }) {
    return (
        <div className="px-1 pt-10 sm:px-4">
            <div className="relative h-8 rounded-lg bg-muted">
                <div className="absolute inset-y-0 left-0 rounded-l-lg bg-primary" style={{ width: `${earned}%` }} />
                <div
                    className="absolute inset-y-0 bg-primary/15"
                    style={{
                        left: `${earned}%`,
                        width: `${Math.max(0, ceiling - earned)}%`,
                        backgroundImage:
                            'repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklch, var(--primary) 35%, transparent) 5px 8px)',
                    }}
                />
                {gradeBounds.map((bound) => (
                    <span
                        key={bound}
                        className="absolute inset-y-0 border-l border-card"
                        style={{ left: `${bound}%` }}
                    />
                ))}
                <div
                    className="absolute -inset-y-2 border-l-2 border-foreground"
                    style={{ left: `${Math.min(projected, 100)}%` }}
                >
                    <span className="absolute bottom-full left-0 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background">
                        {formatPoints(projected)} pts
                    </span>
                </div>
            </div>
            <div className="relative mt-2 h-12 text-xs text-muted-foreground">
                {gradeBounds.map((bound) => (
                    <span key={bound} className="absolute -translate-x-1/2" style={{ left: `${bound}%` }}>
                        {bound}
                    </span>
                ))}
                {[5, 6, 7, 8, 9, 10].map((grade, index) => {
                    const edges = [0, ...gradeBounds, 100];
                    const midpoint = (edges[index] + edges[index + 1]) / 2;
                    return (
                        <span
                            key={grade}
                            className="absolute top-5 -translate-x-1/2 font-serif text-xl text-foreground"
                            style={{ left: `${midpoint}%` }}
                        >
                            {grade}
                        </span>
                    );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-sm bg-primary" />
                    Earned so far
                </span>
                <span className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-sm bg-primary/20" />
                    Still available
                </span>
                <span className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-sm bg-muted" />
                    Points already lost
                </span>
            </div>
        </div>
    );
}

function ProgressRow({
    label,
    detail,
    earned,
    lost,
    pending,
    max,
    average,
}: {
    label: string;
    detail: string;
    earned: number;
    lost: number;
    pending: number;
    max: number;
    average: number;
}) {
    return (
        <div className="grid grid-cols-[96px_minmax(0,1fr)_68px] items-center gap-3 border-t py-3 first:border-0 sm:grid-cols-[125px_minmax(0,1fr)_86px]">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
            <div className="relative flex h-2.5 overflow-visible rounded-full bg-muted">
                <span className="rounded-l-full bg-primary" style={{ width: `${(earned / max) * 100}%` }} />
                <span className="bg-muted-foreground/25" style={{ width: `${(lost / max) * 100}%` }} />
                <span className="rounded-r-full bg-primary/15" style={{ width: `${(pending / max) * 100}%` }} />
                <span
                    className="absolute -inset-y-1 w-0.5 rounded bg-foreground"
                    style={{ left: `${average * 100}%` }}
                />
            </div>
            <div className="text-right font-medium tabular-nums">
                {formatPoints(earned)} / {formatPoints(max - pending)}
                <p className="text-xs font-normal text-muted-foreground">of {formatPoints(max)} pts</p>
            </div>
        </div>
    );
}

function OverviewTab({ finalScore, setFinalScore }: { finalScore: number; setFinalScore: (score: number) => void }) {
    const graded = assessments.filter((item) => item.status === 'graded');
    const gradedEarned = sum(graded.map((item) => item.score ?? 0));
    const gradedMax = sum(graded.map((item) => item.max));
    const pendingCoursework = sum(
        assessments.filter((item) => item.status !== 'graded' && item.id !== 'final').map((item) => item.max),
    );
    const pace = gradedEarned / gradedMax;
    const earned = gradedEarned + attendancePoints;
    const lost = gradedMax - gradedEarned + (5 - attendancePoints);
    const ceiling = 100 - lost;
    const baseProjection = earned + pendingCoursework * pace;
    const projected = baseProjection + (finalScore / 100) * finalMax;
    const grade = finalScore >= 50 ? gradeFor(projected) : 5;

    const breakdown = [
        ...categories.map((category) => {
            const items = assessments.filter((item) => item.category === category);
            const completed = items.filter((item) => item.status === 'graded');
            const max = sum(items.map((item) => item.max));
            const completedMax = sum(completed.map((item) => item.max));
            const categoryEarned = sum(completed.map((item) => item.score ?? 0));
            return {
                label: category,
                detail: `${completed.length} of ${items.length} graded`,
                earned: categoryEarned,
                lost: completedMax - categoryEarned,
                pending: max - completedMax,
                max,
                average: sum(completed.map((item) => item.average ?? 0)) / max,
            };
        }),
        {
            label: 'Attendance',
            detail: 'Provisional',
            earned: attendancePoints,
            lost: 5 - attendancePoints,
            pending: 0,
            max: 5,
            average: 0.79,
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/10 p-4 sm:flex-row sm:items-center">
                <AlertTriangle className="size-5 shrink-0 text-primary" />
                <p className="flex-1 text-sm">
                    <strong>One lab absence left.</strong> You have missed 2 of the 3 labs allowed. The latest absence
                    can still be excused for five days.
                </p>
                <Button size="sm" onClick={() => toast.info('The attendance excuse form is not connected yet.')}>
                    Submit an excuse
                </Button>
            </div>

            <Card className="gap-0 py-0">
                <CardHeader className="gap-4 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-7">
                    <div>
                        <CardTitle className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
                            {finalScore < 50 ? 'The final still has its own pass mark.' : `On track for an ${grade}.`}
                        </CardTitle>
                        <CardDescription className="mt-2 max-w-2xl text-sm">
                            {finalScore < 50
                                ? `A score below 50% on the final means a fail, even with ${formatPoints(projected)} total points.`
                                : `${formatPoints(earned)} points are secured, ${formatPoints(pendingCoursework + finalMax)} remain available, and 30 of those come from the final exam.`}
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Grade report export will be available once grades are final.')}
                        >
                            <Download />
                            Report
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Instructor messaging will open here.')}
                        >
                            <MessageCircle />
                            Ask instructor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-7 sm:px-7">
                    <GradeTrack earned={earned} ceiling={ceiling} projected={projected} />
                    <div className="mt-7 grid gap-7 border-t pt-6 lg:grid-cols-[1fr_1.3fr]">
                        <div>
                            <label htmlFor="final-score" className="font-medium">
                                If I score <span className="text-primary">{finalScore}%</span> on the final
                            </label>
                            <input
                                id="final-score"
                                className="mt-3 w-full accent-primary"
                                type="range"
                                min="0"
                                max="100"
                                value={finalScore}
                                onChange={(event) => setFinalScore(Number(event.target.value))}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span>50% to pass</span>
                                <span>100%</span>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Assumes you keep your current {Math.round(pace * 100)}% pace on remaining coursework.
                            </p>
                        </div>
                        <div>
                            <p className="mb-3 font-medium">What each grade needs on the final</p>
                            <div className="grid grid-cols-5 gap-2 overflow-x-auto pb-1">
                                {[6, 7, 8, 9, 10].map((target, index) => {
                                    const needed = Math.max(
                                        50,
                                        Math.ceil(((gradeBounds[index] - baseProjection) / finalMax) * 100),
                                    );
                                    return (
                                        <button
                                            key={target}
                                            type="button"
                                            disabled={needed > 100}
                                            onClick={() => setFinalScore(needed)}
                                            className="min-w-20 rounded-lg border bg-background p-2 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <span className="block font-serif text-2xl">{target}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {needed > 100 ? 'Out of reach' : `At least ${needed}%`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-serif text-2xl font-normal">Where your points come from</CardTitle>
                        <CardDescription>Each bar represents the full weight of that course component.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {breakdown.map((row) => (
                            <ProgressRow key={row.label} {...row} />
                        ))}
                        <p className="mt-2 text-xs text-muted-foreground">
                            The dark marker is the current class average. Attendance remains provisional.
                        </p>
                    </CardContent>
                </Card>
                <div className="space-y-5">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl font-normal">Coming up</CardTitle>
                            <CardDescription>Deadlines and grades you are waiting on.</CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {[
                                ['In 3 days', 'Assignment 5 · Graph traversal', 'Worth 3 points'],
                                ['This week', 'Lab 7 grade', 'Submitted, with the teaching assistant'],
                                ['Week 12', 'Quiz 5 · Graphs', 'Worth 2 points'],
                                ['Exam period', 'Final exam', 'Worth 30 points · 50% to pass'],
                            ].map(([when, title, detail]) => (
                                <div key={title} className="grid grid-cols-[76px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="text-xs font-semibold text-primary">{when}</span>
                                    <div>
                                        <p className="font-medium">{title}</p>
                                        <p className="text-xs text-muted-foreground">{detail}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl font-normal">Final exam eligibility</CardTitle>
                            <CardDescription>Requirements from the course syllabus.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                [true, 'Attendance of at least 70%', 'You are currently at 82.6%'],
                                [false, 'No more than 3 lab absences', '2 used, 1 remaining'],
                                [true, '25 coursework points', `You already have ${formatPoints(earned)} points`],
                                [null, 'All labs submitted', '7 of 8 complete'],
                            ].map(([state, title, detail]) => (
                                <div key={String(title)} className="flex gap-3">
                                    <span
                                        className={`grid size-5 shrink-0 place-items-center rounded-full text-xs ${state === true ? 'bg-success text-success-foreground' : state === false ? 'bg-warning text-warning-foreground' : 'border border-dashed text-muted-foreground'}`}
                                    >
                                        {state === true ? <Check className="size-3" /> : state === false ? '!' : '·'}
                                    </span>
                                    <div>
                                        <p className="font-medium">{title}</p>
                                        <p className="text-xs text-muted-foreground">{detail}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function AttendanceTab() {
    return (
        <div className="space-y-5">
            <Card>
                <CardContent className="grid items-center gap-6 py-3 sm:grid-cols-[220px_1fr]">
                    <div>
                        <p className="font-serif text-5xl">82.6%</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Overall attendance. Excused sessions do not count against you.
                        </p>
                    </div>
                    <div>
                        <div className="relative h-3 rounded-full bg-muted">
                            <div className="h-full w-[82.6%] rounded-full bg-success" />
                            <span className="absolute -inset-y-1 left-[70%] w-0.5 bg-foreground" />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>70% required</span>
                            <span>100%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {attendanceRows.map((row) => (
                <Card key={row.type}>
                    <CardHeader className="sm:grid-cols-[1fr_auto]">
                        <div>
                            <CardTitle className="font-serif text-2xl font-normal">{row.type}</CardTitle>
                            <CardDescription>{row.time}</CardDescription>
                        </div>
                        <p className="font-serif text-3xl">{row.rate}%</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
                            {courseWeeks.map((week) => {
                                const held = week <= row.held;
                                const absent = held && week > row.attended;
                                return (
                                    <div key={`${row.type}-week-${week}`} className="text-center">
                                        <div
                                            className={`grid h-9 place-items-center rounded-lg text-xs font-semibold ${!held ? 'border border-dashed text-muted-foreground' : absent ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}
                                        >
                                            {!held ? '–' : absent ? 'A' : 'P'}
                                        </div>
                                        <span className="mt-1 block text-[11px] text-muted-foreground">{week}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>P · Present</span>
                <span>A · Absent</span>
                <span>– · Upcoming</span>
                <span>Late arrivals count as present.</span>
            </div>
        </div>
    );
}

function AssessmentStatusBadge({ item }: { item: Assessment }) {
    if (item.status === 'graded')
        return (
            <Badge className="bg-success/15 text-success shadow-none">
                {Math.round(((item.score ?? 0) / item.max) * 100)}%
            </Badge>
        );
    if (item.status === 'submitted')
        return <Badge className="bg-blue-500/15 text-blue-700 shadow-none dark:text-blue-300">Awaiting grade</Badge>;
    if (item.status === 'open')
        return <Badge className="bg-primary/15 text-primary shadow-none">{item.statusLabel}</Badge>;
    return <Badge variant="secondary">{item.statusLabel}</Badge>;
}

function ScoresTab() {
    const [filter, setFilter] = useState<'All' | Assessment['category']>('All');
    const visibleCategories = filter === 'All' ? categories : categories.filter((category) => category === filter);
    return (
        <Card>
            <CardContent className="pt-1">
                <div className="mb-4 flex flex-wrap gap-2">
                    {(['All', ...categories] as const).map((item) => (
                        <Button
                            key={item}
                            variant={filter === item ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full"
                            onClick={() => setFilter(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </div>
                {visibleCategories.map((category) => {
                    const items = assessments.filter((item) => item.category === category);
                    const graded = items.filter((item) => item.status === 'graded');
                    return (
                        <section key={category} className="mt-5 first:mt-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                                <h2 className="font-serif text-2xl">{category}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {formatPoints(sum(graded.map((item) => item.score ?? 0)))} of{' '}
                                    {formatPoints(sum(items.map((item) => item.max)))} points · {graded.length} of{' '}
                                    {items.length} graded
                                </p>
                            </div>
                            {items.map((item) => (
                                <Collapsible key={item.id} className="border-t">
                                    <CollapsibleTrigger className="group grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-1 py-4 text-left sm:grid-cols-[minmax(0,1.4fr)_60px_minmax(130px,0.7fr)_auto_20px]">
                                        <span className="font-medium">
                                            {item.name}
                                            <small className="block font-normal text-muted-foreground">
                                                {item.topic}
                                            </small>
                                        </span>
                                        <span className="hidden text-sm text-muted-foreground sm:block">
                                            Wk {item.week}
                                        </span>
                                        <span className="hidden sm:block">
                                            {item.score === undefined ? (
                                                <span className="text-muted-foreground">
                                                    — / {formatPoints(item.max)}
                                                </span>
                                            ) : (
                                                <span className="font-medium tabular-nums">
                                                    {formatPoints(item.score)} / {formatPoints(item.max)}
                                                    <span className="relative mt-1 block h-1.5 rounded-full bg-muted">
                                                        <i
                                                            className="block h-full rounded-full bg-primary"
                                                            style={{ width: `${(item.score / item.max) * 100}%` }}
                                                        />
                                                        <i
                                                            className="absolute -inset-y-0.5 w-0.5 bg-foreground"
                                                            style={{
                                                                left: `${((item.average ?? 0) / item.max) * 100}%`,
                                                            }}
                                                        />
                                                    </span>
                                                </span>
                                            )}
                                        </span>
                                        <AssessmentStatusBadge item={item} />
                                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="grid gap-4 px-1 pb-5 sm:grid-cols-2">
                                        <div>
                                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {item.status === 'graded' ? 'Feedback' : 'Status'}
                                            </p>
                                            <p className="text-sm">
                                                {item.feedback ??
                                                    (item.status === 'submitted'
                                                        ? 'Your work was received and is waiting to be graded.'
                                                        : item.status === 'open'
                                                          ? 'Submission is open. Late penalties may apply after the deadline.'
                                                          : 'This assessment is not open yet.')}
                                            </p>
                                        </div>
                                        {item.status === 'graded' ? (
                                            <div>
                                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Compared with class
                                                </p>
                                                <p className="text-sm">
                                                    You scored {formatPoints(item.score ?? 0)}; the class average is{' '}
                                                    {formatPoints(item.average ?? 0)} out of {formatPoints(item.max)}.
                                                </p>
                                            </div>
                                        ) : null}
                                        {item.status === 'graded' ? (
                                            <div className="flex gap-2 sm:col-span-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toast.info('Review request drafted.')}
                                                >
                                                    <MessageCircle />
                                                    Request review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        toast.info('Submission preview is not connected yet.')
                                                    }
                                                >
                                                    <FileText />
                                                    View submission
                                                </Button>
                                            </div>
                                        ) : null}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </section>
                    );
                })}
                <p className="mt-5 text-xs text-muted-foreground">
                    The marker on each score bar shows the class average. Open a row for feedback.
                </p>
            </CardContent>
        </Card>
    );
}

export function CourseGradesPage() {
    const { code: routeCode } = useParams({ strict: false });
    const code = routeCode ?? '';
    const { data: course, isLoading } = useGetCourseByCode(code);
    const [finalScore, setFinalScore] = useState(81);
    const currentWeek = 9;

    if (isLoading) return <div className="mx-auto max-w-7xl py-10 text-muted-foreground">Loading grades…</div>;

    return (
        <div className="mx-auto w-full max-w-7xl pb-10">
            <header className="mb-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <Badge variant="secondary">{course?.code ?? code}</Badge>
                        <Badge variant="outline">6 ECTS</Badge>
                    </div>
                    <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-normal leading-none tracking-tight">
                        {course?.name ?? 'Course grades'}
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Your current standing, requirements, attendance, and assessment feedback.
                    </p>
                </div>
                <div className="w-full max-w-sm">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            Week {currentWeek} of 14
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            Final in exam period
                        </span>
                    </div>
                    <div className="grid grid-cols-14 gap-1">
                        {courseWeeks.map((week) => (
                            <span
                                key={week}
                                className={`h-2 rounded-sm ${week < currentWeek ? 'bg-foreground' : week === currentWeek ? 'bg-primary' : 'bg-muted'}`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            <Tabs defaultValue="overview" className="gap-6">
                <div className="overflow-x-auto border-b">
                    <TabsList variant="line" className="h-10 min-w-max">
                        <TabsTrigger value="overview" className="px-4">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="px-4">
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger value="scores" className="px-4">
                            Scores & feedback
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="overview">
                    <OverviewTab finalScore={finalScore} setFinalScore={setFinalScore} />
                </TabsContent>
                <TabsContent value="attendance">
                    <AttendanceTab />
                </TabsContent>
                <TabsContent value="scores">
                    <ScoresTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
