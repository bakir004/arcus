import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-heading font-semibold leading-tight tracking-tight", {
    variants: {
        size: {
            xs: "text-sm",
            sm: "text-base",
            md: "text-lg",
            lg: "text-xl",
            xl: "text-2xl",
            "2xl": "text-3xl",
            "3xl": "text-4xl",
        },
        tone: {
            default: "text-foreground",
            muted: "text-muted-foreground",
            primary: "text-primary",
        },
    },
    defaultVariants: {
        size: "lg",
        tone: "default",
    },
})

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const levelSizeMap: Record<HeadingLevel, VariantProps<typeof headingVariants>["size"]> = {
    1: "3xl",
    2: "2xl",
    3: "xl",
    4: "lg",
    5: "md",
    6: "sm",
}

type HeadingVariantProps = VariantProps<typeof headingVariants>

export interface HeadingProps
    extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
        HeadingVariantProps {
    level?: HeadingLevel
    color?: HeadingVariantProps["tone"]
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
    ({ level = 2, size, tone, color, className, ...props }, ref) => {
        const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
        const resolvedSize = size ?? levelSizeMap[level]

        return (
            <Tag
                ref={ref}
                className={cn(
                    headingVariants({ size: resolvedSize, tone: tone ?? color }),
                    className,
                )}
                {...props}
            />
        )
    },
)
Heading.displayName = "Heading"
