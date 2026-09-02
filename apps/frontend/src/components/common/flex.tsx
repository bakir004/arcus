import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type Gap = number | string;

const flexVariants = cva('flex', {
    variants: {
        direction: {
            row: 'flex-row',
            column: 'flex-col',
            'row-reverse': 'flex-row-reverse',
            'column-reverse': 'flex-col-reverse',
        },
        align: {
            start: 'items-start',
            center: 'items-center',
            end: 'items-end',
            stretch: 'items-stretch',
            baseline: 'items-baseline',
        },
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
            around: 'justify-around',
            evenly: 'justify-evenly',
        },
        wrap: {
            true: 'flex-wrap',
            false: 'flex-nowrap',
        },
    },
    defaultVariants: {
        direction: 'row',
        align: 'center',
        justify: 'start',
        wrap: false,
    },
});

function gapToCssValue(gap: Gap | null | undefined) {
    if (gap == null) return undefined;
    if (typeof gap === 'number') return `${gap * 0.25}rem`;
    return gap;
}

export interface FlexProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
        VariantProps<typeof flexVariants> {
    gap?: Gap;
    style?: React.CSSProperties;
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
    ({ className, direction, align, justify, wrap, gap, style, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(flexVariants({ direction, align, justify, wrap }), className)}
            style={{ gap: gapToCssValue(gap), ...style }}
            {...props}
        />
    ),
);
Flex.displayName = 'Flex';
