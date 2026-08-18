import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/common';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const title =
        pathname
            .split('/')
            .filter(Boolean)
            .at(-1)
            ?.replaceAll('-', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? 'Overview';
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-h-svh">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />

                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to="/">Arcus</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <ThemeToggle className="ml-auto" />
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
