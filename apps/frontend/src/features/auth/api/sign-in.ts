import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';

export type AuthError = {
    message: string;
    code: string;
};

export type SignInRequest = {
    email: string;
    password: string;
};

export type GoogleSignInResponse = {
    url?: string;
};

export async function signInWithEmail(payload: SignInRequest) {
    return apiClient<unknown>('/auth/sign-in/email', {
        method: 'POST',
        body: payload,
        credentials: 'include',
    });
}

export const useSignInWithGoogle = () =>
    useMutation({
        mutationFn: (callbackURL: string) =>
            apiClient<GoogleSignInResponse>('/auth/sign-in/social', {
                method: 'POST',
                body: { provider: 'google', callbackURL },
            }),
    });
