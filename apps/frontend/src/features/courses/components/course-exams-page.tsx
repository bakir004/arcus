import { CalendarDays, DoorOpen, FileClock, MessageSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Box, Group } from '@/components/common';

type DemoTimeslot = {
    startsAt: string;
    location: string;
    registrationDueAt: string | null;
    registrationCount: number;
    capacity: number;
    comment: string | null;
};

type DemoExam = {
    title: string;
    description: string;
    type: 'Online' | 'Written' | 'Verbal';
    durationMinutes: number;
    maxAttempts: number;
    timeslots: DemoTimeslot[];
};

const demoExams: DemoExam[] = [
    {
        title: 'Midterm exam',
        description: 'The first assessment covering the material from the beginning of the semester.',
        type: 'Online',
        durationMinutes: 90,
        maxAttempts: 1,
        timeslots: [
            {
                startsAt: 'Apr 15, 2026, 10:00 AM',
                location: 'A-101',
                registrationDueAt: 'Apr 10, 2026',
                registrationCount: 24,
                capacity: 40,
                comment: null,
            },
            {
                startsAt: 'Apr 16, 2026, 2:00 PM',
                location: 'B-201',
                registrationDueAt: 'Apr 10, 2026',
                registrationCount: 18,
                capacity: 30,
                comment: 'Bring your own laptop.',
            },
        ],
    },
    {
        title: 'Final exam',
        description: 'Comprehensive final examination for the course.',
        type: 'Written',
        durationMinutes: 120,
        maxAttempts: 1,
        timeslots: [
            {
                startsAt: 'Jun 20, 2026, 9:00 AM',
                location: 'Main hall',
                registrationDueAt: 'Jun 12, 2026',
                registrationCount: 42,
                capacity: 50,
                comment: null,
            },
        ],
    },
];

const examTypeVariant = {
    Online: 'secondary',
    Written: 'outline',
    Verbal: 'ghost',
} as const;

export function CourseExamsPage() {
    return (
        <Box className="mx-auto w-full max-w-7xl">
            <Group className="mb-8" justify="between" align="start" gap={4}>
                <Box>
                    <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Grouped exam terms and their available timeslots.
                    </p>
                </Box>
                <Badge variant="outline">{demoExams.length} exams</Badge>
            </Group>

            <Box className="space-y-4">
                {demoExams.map((exam) => (
                    <Box key={exam.title} className="overflow-hidden rounded-xl border border-border bg-card">
                        <Box className="border-b border-border px-5 py-4 transition-colors hover:bg-accent/50">
                            <Group gap={3}>
                                <Box className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                                    <CalendarDays className="size-5" />
                                </Box>
                                <Box className="min-w-0">
                                    <Group gap={2} align="center" className="flex-wrap">
                                        <h2 className="text-lg font-semibold">{exam.title}</h2>
                                        <Badge variant={examTypeVariant[exam.type]}>{exam.type}</Badge>
                                        <Badge variant="outline">{exam.durationMinutes} min</Badge>
                                        <Badge variant="ghost">{exam.maxAttempts} max attempts</Badge>
                                    </Group>
                                    <p className="mt-1 text-sm text-muted-foreground">{exam.description}</p>
                                </Box>
                            </Group>
                        </Box>

                        <Box className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead>
                                    <tr className="text-xs text-muted-foreground">
                                        <th className="p-3">#</th>
                                        <th className="p-3">
                                            <Group gap={1}>
                                                <CalendarDays className="size-4" />
                                                Date / time
                                            </Group>
                                        </th>
                                        <th className="p-3">
                                            <Group gap={1}>
                                                <DoorOpen className="size-4" />
                                                Room
                                            </Group>
                                        </th>
                                        <th className="p-3">
                                            <Group gap={1}>
                                                <FileClock className="size-4" />
                                                Register by
                                            </Group>
                                        </th>
                                        <th className="p-3">
                                            <Group gap={1}>
                                                <Users className="size-4" />
                                                Signed up
                                            </Group>
                                        </th>
                                        <th className="p-3">
                                            <Group gap={1}>
                                                <MessageSquare className="size-4" />
                                                Comment
                                            </Group>
                                        </th>
                                        <th className="p-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {exam.timeslots.map((slot, index) => (
                                        <tr key={slot.startsAt} className="border-t border-border">
                                            <td className="p-3">{index + 1}</td>
                                            <td className="p-3">{slot.startsAt}</td>
                                            <td className="p-3">{slot.location}</td>
                                            <td className="p-3">{slot.registrationDueAt ?? '—'}</td>
                                            <td className="p-3">
                                                {slot.registrationCount}/{slot.capacity}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{slot.comment ?? '—'}</td>
                                            <td className="p-3 text-right">
                                                <Button type="button" size="sm" disabled>
                                                    Register
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
