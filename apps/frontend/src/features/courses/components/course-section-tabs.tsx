import { Link, useRouterState } from '@tanstack/react-router';
import { Box, Group } from '@/components/common';
import { useGetCourseMe } from '@/features/courses/api/get-course-me';
import { useGetCourseByCode } from '@/features/courses/api/get-course';
import { useAuth } from '@/features/auth/lib/use-auth';

type CourseSection = {
    label: string;
    path: string;
    studentOnly?: boolean;
    staffOnly?: boolean;
};

const courseSections: CourseSection[] = [
    { label: 'Materials', path: '' },
    { label: 'Assignments', path: '/assignments' },
    { label: 'Exams', path: '/exams' },
    { label: 'Grades', path: '/grades', studentOnly: true },
    { label: 'Gradebook', path: '/gradebook', staffOnly: true },
    { label: 'Review', path: '/review', staffOnly: true },
    { label: 'Roles', path: '/roles', staffOnly: true },
    { label: 'Analytics', path: '/analytics', staffOnly: true },
    { label: 'Settings', path: '/settings', staffOnly: true },
] as const;

export function CourseSectionTabs({ courseCode }: { courseCode: string }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const { data: course } = useGetCourseByCode(courseCode);
    const { data: courseMe } = useGetCourseMe(course?.id ?? '');
    const { isStudent } = useAuth();
    const basePath = `/courses/${courseCode}`;
    const canAccessStaffSections =
        !isStudent &&
        (courseMe?.permissions.some((permission) =>
            ['answer:grade', 'answer:read-all', 'attempt:read-all', 'course:manage', 'course:role:manage'].includes(
                permission,
            ),
        ) ??
            false);

    return (
        <Box as="nav" className="border-b border-border px-6" aria-label="Course sections">
            <Group className="min-w-max overflow-x-auto" gap={6}>
                {courseSections.map((section) => {
                    if (section.staffOnly && !canAccessStaffSections) return null;
                    if (section.studentOnly && !isStudent) return null;

                    const href = `${basePath}${section.path}`;
                    const isActive = section.path === '' ? pathname === basePath : pathname.startsWith(href);

                    return (
                        <Link
                            key={section.label}
                            to={href}
                            className="relative inline-flex h-11 items-center whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground"
                            data-active={isActive}
                        >
                            {section.label}
                            {isActive ? (
                                <Box className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                            ) : null}
                        </Link>
                    );
                })}
            </Group>
        </Box>
    );
}
