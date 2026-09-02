import { getRequestHeader } from '@tanstack/react-start/server';

/**
 * Reads a header from the current frontend-server request.
 *
 * This is used by `api-client.ts` during SSR/server functions to forward the
 * browser's `cookie` header to the backend. It is never needed for browser
 * requests, where `fetch(..., { credentials: 'include' })` handles cookies.
 */
export function getServerRequestHeader(name: string): string | undefined {
    return getRequestHeader(name) ?? undefined;
}
