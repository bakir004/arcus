import * as React from 'react';
import { Flex, type FlexProps } from './flex';

export type GroupProps = Omit<FlexProps, 'direction'>;

export const Group = React.forwardRef<HTMLDivElement, GroupProps>((props, ref) => (
    <Flex ref={ref} direction="row" {...props} />
));
Group.displayName = 'Group';
