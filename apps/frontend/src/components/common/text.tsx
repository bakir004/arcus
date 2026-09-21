import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
    variants: {
        size: {
            xs: "text-xs",
            sm: "text-sm",
            base: "text-base",
            lg: "text-lg",
            xl: "text-xl",
        },
        weight: {
            normal: "font-normal",
            medium: "font-medium",
            semibold: "font-semibold",
            bold: "font-bold",
        },
        tone: {
            default: "text-foreground",
            muted: "text-muted-foreground",
            primary: "text-primary",
            destructive: "text-destructive",
            success: "text-success",
            warning: "text-warning",
        },
        truncate: {
            true: "truncate",
            false: "",
        },
        leading: {
            none: "leading-none",
            tight: "leading-tight",
            normal: "leading-normal",
            relaxed: "leading-relaxed",
        },
    },
    defaultVariants: {
        size: "sm",
        weight: "normal",
        tone: "default",
        leading: "normal",
    },
})

type TextElement = "p" | "span" | "label" | "div" | "li" | "strong" | "em"

type TextVariantProps = VariantProps<typeof textVariants>

export interface TextProps
    extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
        TextVariantProps {
    as?: TextElement
    htmlFor?: string
    color?: TextVariantProps["tone"]
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
    ({ as: Tag = "p", className, size, weight, tone, color, truncate, leading, ...props }, ref) => {
        return React.createElement(Tag, {
            ref,
            className: cn(
                textVariants({ size, weight, tone: tone ?? color, truncate, leading }),
                className,
            ),
            ...props,
        })
    },
)
Text.displayName = "Text"
