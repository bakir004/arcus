import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
    return (
        <main className="flex min-h-screen items-center justify-center">
            <Button>Arcus</Button>
        </main>
    );
}
