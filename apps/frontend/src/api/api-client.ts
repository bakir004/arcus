const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const API_VERSION = import.meta.env.VITE_API_VERSION ?? 'v1';

function trimSlashes(value: string): string {
    return value.replace(/^\/+|\/+$/g, '');
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    params?: Record<string, unknown>;
    responseType?: 'json' | 'blob';
}

export async function apiClient<T>(
    endpoint: string,
    { body, method, params, responseType, ...customConfig }: ApiOptions = {},
): Promise<T> {
    const headers = new Headers(customConfig.headers);
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (import.meta.env.SSR) {
        const { getServerRequestHeader } = await import('./api-client.server');
        const cookie = getServerRequestHeader('cookie');
        if (cookie && !headers.has('cookie')) {
            headers.set('cookie', cookie);
        }
    }

    let queryString = '';
    if (params) {
        const cleanParams = Object.fromEntries(
            Object.entries(params)
                .filter(([, v]) => v != null)
                .map(([k, v]) => [k, String(v)]),
        );
        queryString = `?${new URLSearchParams(cleanParams).toString()}`;
    }

    const config: RequestInit = {
        method: method ?? (body ? 'POST' : 'GET'),
        credentials: customConfig.credentials ?? 'include',
        ...customConfig,
        headers,
        ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    };

    let baseUrl = BASE_URL;
    if (import.meta.env.SSR && BASE_URL.startsWith('/')) {
        const { getServerRequestHeader } = await import('./api-client.server');
        const proto =
            getServerRequestHeader('x-forwarded-proto') ??
            (getServerRequestHeader('host')?.includes('localhost') ? 'http' : 'https');
        const host = getServerRequestHeader('x-forwarded-host') ?? getServerRequestHeader('host') ?? 'localhost:3000';
        baseUrl = `${proto}://${host}${BASE_URL}`;
    }

    const url = `${baseUrl}/${trimSlashes(API_VERSION)}${endpoint}${queryString}`;

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Promise.reject({ status: response.status, ...errorData });
    }

    if (response.status === 204) return {} as T;
    if (responseType === 'blob') return (await response.blob()) as unknown as T;
    return response.json() as Promise<T>;
}
