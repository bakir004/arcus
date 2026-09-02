import { apiClient } from '#/lib/api-client';

export function signOut() {
    return apiClient<Record<string, unknown>>('/auth/sign-out', {
        method: 'POST',
    });
}
