import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Page({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return (
        <main
            className={cn(
                'container mx-auto w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8',
                className,
            )}
            {...props}
        />
    );
}

export function PageHeader({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <header
            className={cn(
                'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
                className,
            )}
            {...props}
        />
    );
}

export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function Inline({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-wrap items-center gap-3', className)}
            {...props}
        />
    );
}
