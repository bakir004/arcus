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

export const meQueryKey = ['auth', 'me'] as const;

export function getMeRequest() {
    return apiClient<GlobalMeResponse>('/me', {
        method: 'GET',
    });
}

export const useGetMe = () =>
    useQuery<GlobalMeResponse>({
        queryKey: meQueryKey,
        queryFn: () => getMeRequest(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
