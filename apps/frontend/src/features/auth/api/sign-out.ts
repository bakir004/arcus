import { apiClient } from '@/api/api-client';

export const signOut = () => apiClient<Record<string, unknown>>('/auth/sign-out', { method: 'POST' });
