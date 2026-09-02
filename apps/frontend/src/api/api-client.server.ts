import { getRequestHeader } from '@tanstack/react-start/server';

export function getServerRequestHeader(name: string): string | undefined {
    return getRequestHeader(name) ?? undefined;
}
