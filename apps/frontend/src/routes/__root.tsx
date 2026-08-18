import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
} from '@tanstack/react-router';
import { AppShell } from '@/components/app/app-shell';
import { NotFound } from '@/components/app/not-found';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: 'TanStack Start Starter',
            },
        ],
        links: [
            {
                rel: 'stylesheet',
                href: appCss,
            },
        ],
    }),
    shellComponent: RootDocument,
    component: AppRoot,
    notFoundComponent: NotFound,
});

function AppRoot() {
    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}

                <Scripts />
            </body>
        </html>
    );
}
