import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export interface GlobalMeResponse {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
    session?: unknown;
    roles?: string[];
    permissions?: string[];
}

export const getMeRequest = () => apiClient<GlobalMeResponse>('/me', { method: 'GET' });

export const useGetMe = () =>
    useQuery<GlobalMeResponse>({
        queryKey: ['auth', 'me'],
        queryFn: () => getMeRequest(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
