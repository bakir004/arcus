import * as React from 'react';
import { cn } from '#/lib/utils';

type BoxElement = 'div' | 'span' | 'main' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
    as?: BoxElement;
}

export const Box = React.forwardRef<HTMLElement, BoxProps>(({ as: Tag = 'div', className, ...props }, ref) =>
    React.createElement(Tag, {
        ref,
        className: cn(className),
        ...props,
    }),
);
Box.displayName = 'Box';
