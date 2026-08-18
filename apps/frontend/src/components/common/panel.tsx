import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <section
            className={cn(
                'rounded-xl border bg-card text-card-foreground shadow-sm',
                className,
            )}
            {...props}
        />
    );
}

export function PanelHeader({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col gap-1.5 border-b p-6', className)}
            {...props}
        />
    );
}

export function PanelBody({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-6', className)} {...props} />;
}

export function PanelFooter({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex items-center border-t bg-muted/30 p-6',
                className,
            )}
            {...props}
        />
    );
}
