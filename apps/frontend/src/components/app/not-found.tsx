import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Body, Display, Inline, Muted, Page, Stack } from '@/components/common';

export function NotFound() {
    return (
        <Page className="grid min-h-[calc(100svh-4rem)] place-items-center">
            <Stack className="max-w-md items-center text-center">
                <span className="grid size-24 place-items-center rounded-full border bg-card shadow-sm">
                    <Compass className="size-11 text-primary" />
                </span>
                <Stack className="items-center gap-2">
                    <Body className="font-semibold uppercase tracking-[0.3em] text-primary">
                        404
                    </Body>
                    <Display>Page not found</Display>
                    <Muted>
                        The page you are looking for is missing, moved, or
                        hiding somewhere else.
                    </Muted>
                </Stack>
                <Inline>
                    <Button type="button" onClick={() => window.history.back()}>
                        Go back
                    </Button>
                </Inline>
            </Stack>
        </Page>
    );
}
