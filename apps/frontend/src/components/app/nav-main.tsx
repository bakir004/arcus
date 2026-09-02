import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '#/components/ui/sidebar.tsx';

export function NavMain({
    items,
    label = 'Platform',
}: {
    items: {
        title: string;
        url: string;
        icon: React.ReactNode;
        isActive?: boolean;
    }[];
    label?: string;
}) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                            <Link to={item.url}>
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
