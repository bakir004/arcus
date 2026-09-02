import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app/app-shell';
import { NotFound } from '@/components/app/not-found';
import { queryClient } from '@/lib/query-client';
import appCss from '../styles.css?url';

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
    notFoundComponent: NotFound,
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'Arcus' },
        ],
        links: [{ rel: 'stylesheet', href: appCss }],
    }),
    shellComponent: RootDocument,
    component: Outlet,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname });

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the inline initializer prevents theme flashing before hydration. */}
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
                <HeadContent />
            </head>
            <body className="antialiased">
                <QueryClientProvider client={queryClient}>
                    <TooltipProvider>
                        {pathname === '/login' ? children : <AppShell pathname={pathname}>{children}</AppShell>}
                    </TooltipProvider>
                </QueryClientProvider>
                <Scripts />
            </body>
        </html>
    );
}
