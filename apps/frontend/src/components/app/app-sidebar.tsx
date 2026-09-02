'use client';

import * as React from 'react';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '#/components/ui/sidebar.tsx';
import { useGetCourses } from '#/features/courses/api/get-courses';
import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpenIcon, GraduationCapIcon, LifeBuoyIcon, SendIcon, TerminalIcon } from 'lucide-react';

const navSecondary = [
    {
        title: 'Support',
        url: '#',
        icon: <LifeBuoyIcon />,
    },
    {
        title: 'Feedback',
        url: '#',
        icon: <SendIcon />,
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const { data: courses } = useGetCourses();

    const courseItems = (courses ?? []).map((course) => ({
        title: course.name,
        url: `/courses/${course.id}`,
        icon: <BookOpenIcon />,
        isActive: pathname === `/courses/${course.id}` || pathname.startsWith(`/courses/${course.id}/`),
    }));

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <TerminalIcon className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Arcus</span>
                                    <span className="truncate text-xs">Student portal</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain
                    label="Enrolled subjects"
                    items={
                        courseItems.length > 0
                            ? courseItems
                            : [
                                  {
                                      title: 'My courses',
                                      url: '/',
                                      icon: <GraduationCapIcon />,
                                      isActive: pathname === '/',
                                  },
                              ]
                    }
                />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
