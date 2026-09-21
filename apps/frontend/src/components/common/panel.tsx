import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const panelVariants = cva("rounded-lg border border-border bg-card", {
    variants: {
        padding: {
            none: "p-0",
            sm: "p-3",
            md: "p-5",
            lg: "p-6",
        },
    },
    defaultVariants: {
        padding: "md",
    },
})

export interface PanelProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof panelVariants> {}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
    ({ className, padding, ...props }, ref) => (
        <div ref={ref} className={cn(panelVariants({ padding }), className)} {...props} />
    ),
)
Panel.displayName = "Panel"

export interface SectionProps
    extends React.HTMLAttributes<HTMLElement>,
        VariantProps<typeof panelVariants> {}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
    ({ className, padding, ...props }, ref) => (
        <section ref={ref} className={cn(panelVariants({ padding }), className)} {...props} />
    ),
)
Section.displayName = "Section"
