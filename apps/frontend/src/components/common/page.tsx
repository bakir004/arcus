import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pageVariants = cva("min-h-[calc(100svh-5rem)] bg-background", {
    variants: {
        padding: {
            none: "",
            sm: "px-4 py-6",
            md: "px-6 py-10",
            lg: "px-6 py-14",
        },
    },
    defaultVariants: {
        padding: "md",
    },
})

const containerVariants = cva("mx-auto w-full", {
    variants: {
        size: {
            sm: "max-w-2xl",
            md: "max-w-4xl",
            lg: "max-w-6xl",
            xl: "max-w-7xl",
            courses: "max-w-[785px]",
            full: "max-w-none",
        },
    },
    defaultVariants: {
        size: "lg",
    },
})

export interface PageProps
    extends React.HTMLAttributes<HTMLElement>,
        VariantProps<typeof pageVariants>,
        VariantProps<typeof containerVariants> {
    containerClassName?: string
}

export const Page = React.forwardRef<HTMLElement, PageProps>(
    ({ className, containerClassName, padding, size, children, ...props }, ref) => (
        <main ref={ref} className={cn(pageVariants({ padding }), className)} {...props}>
            <div className={cn(containerVariants({ size }), containerClassName)}>{children}</div>
        </main>
    ),
)
Page.displayName = "Page"
