import { CompassIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
    return (
        <main className="grid min-h-screen place-items-center px-6 -mt-16">
            <div className="max-w-md space-y-6 text-center">
                <div className="relative mx-auto size-24">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                    <div className="relative grid size-24 place-items-center rounded-full border border-border bg-card shadow-sm">
                        <CompassIcon className="size-11 text-primary" aria-hidden="true" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="font-semibold tracking-[0.3em] text-primary">404</p>
                    <h1 className="text-2xl font-semibold tracking-tight">You drifted off course</h1>
                    <p className="text-base leading-relaxed text-muted-foreground">
                        This page is either missing, moved, or hiding somewhere between lectures.
                    </p>
                </div>

                <Button type="button" onClick={() => window.history.back()}>
                    Go back
                </Button>
            </div>
        </main>
    );
}
