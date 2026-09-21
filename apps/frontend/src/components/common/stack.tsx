import * as React from "react"
import { Flex, type FlexProps } from "./flex"

export type StackProps = Omit<FlexProps, "direction">

export const Stack = React.forwardRef<HTMLDivElement, StackProps>((props, ref) => (
    <Flex ref={ref} direction="column" align="stretch" {...props} />
))
Stack.displayName = "Stack"
