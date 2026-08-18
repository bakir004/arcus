import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TypographyProps = HTMLAttributes<HTMLElement>;

export function Display({ className, ...props }: TypographyProps) {
    return (
        <h1
            className={cn(
                'font-serif text-4xl font-bold tracking-tight sm:text-5xl',
                className,
            )}
            {...props}
        />
    );
}

export function Heading({ className, ...props }: TypographyProps) {
    return (
        <h2
            className={cn('font-serif text-2xl font-semibold tracking-tight', className)}
            {...props}
        />
    );
}

export function Subheading({ className, ...props }: TypographyProps) {
    return (
        <h3
            className={cn('font-serif text-lg font-semibold tracking-tight', className)}
            {...props}
        />
    );
}

export function Body({ className, ...props }: TypographyProps) {
    return (
        <p
            className={cn('text-sm leading-6 text-foreground', className)}
            {...props}
        />
    );
}

export function Muted({ className, ...props }: TypographyProps) {
    return (
        <p
            className={cn('text-sm leading-6 text-muted-foreground', className)}
            {...props}
        />
    );
}

export function Eyebrow({ className, ...props }: TypographyProps) {
    return (
        <p
            className={cn(
                'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}
