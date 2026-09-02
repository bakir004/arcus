import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useGetCourse } from '@/features/courses/api/get-course';
import { Box, Group, ThemeToggle } from '@/components/common';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

function formatBreadcrumbSegment(segment: string) {
    if (segment.length === 0) return '';
    if (/^[0-9a-f-]{8,}$/i.test(segment)) return 'Details';
    return segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function AppShellHeader({ pathname }: { pathname: string }) {
    const segments = pathname.split('/').filter(Boolean);
    const isCourseRoute = segments[0] === 'courses';
    const courseId = isCourseRoute ? segments[1] : undefined;
    const section = isCourseRoute ? segments[2] : undefined;
    const { data: course } = useGetCourse(courseId ?? '');
    const page = formatBreadcrumbSegment(segments.at(-1) ?? '');
    const coursePage = course?.name ?? 'Course';
    const sectionPage = section ? formatBreadcrumbSegment(section) : null;

    return (
        <Box
            as="header"
            className="h-16 shrink-0 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70"
        >
            <Group className="h-full" justify="between" gap={2}>
                <Group className="min-w-0" gap={2}>
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 self-center data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {isCourseRoute && courseId ? (
                                <>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink asChild>
                                            <Link to="/">Courses</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        {sectionPage ? (
                                            <BreadcrumbLink asChild>
                                                <Link to={'/courses/$courseId' as never} params={{ courseId } as never}>
                                                    {coursePage}
                                                </Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{coursePage}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {sectionPage ? (
                                        <>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>{sectionPage}</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink asChild>
                                            <Link to="/">Arcus</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {segments.length > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{page}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </Group>
                <ThemeToggle />
            </Group>
        </Box>
    );
}

export function AppShell({ children, pathname }: { children: React.ReactNode; pathname: string }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-[calc(100svh-1rem)] overflow-y-auto rounded scrollbar-thin">
                <AppShellHeader pathname={pathname} />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
