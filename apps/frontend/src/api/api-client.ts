import { createIsomorphicFn } from '@tanstack/react-start';

/** API origin/prefix shared by browser and frontend-server requests. */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const API_VERSION = import.meta.env.VITE_API_VERSION ?? 'v1';

interface ApiOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    params?: Record<string, unknown>;
    responseType?: 'json' | 'blob';
}

/** Removes boundary slashes so URL segments can be joined predictably. */
function trimSlashes(value: string): string {
    return value.replace(/^\/+|\/+$/g, '');
}

/** Serializes non-null query parameters for the API URL. */
function buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';

    const cleanParams = Object.fromEntries(
        Object.entries(params)
            .filter(([, value]) => value != null)
            .map(([key, value]) => [key, String(value)]),
    );

    return `?${new URLSearchParams(cleanParams).toString()}`;
}

/**
 * Resolves a relative base URL for Node's fetch during SSR.
 * Browsers resolve `/api` against the current origin automatically; Node fetch does not.
 */
const getServerRequestHeader = createIsomorphicFn()
    .client((_name: string): string | undefined => undefined)
    .server(async (name: string): Promise<string | undefined> => {
        const { getServerRequestHeader: getHeader } = await import('./api-client.server');
        return getHeader(name);
    });

async function resolveServerBaseUrl(baseUrl: string): Promise<string> {
    if (!import.meta.env.SSR || !baseUrl.startsWith('/')) return baseUrl;

    const protocol =
        (await getServerRequestHeader('x-forwarded-proto')) ??
        ((await getServerRequestHeader('host'))?.includes('localhost') ? 'http' : 'https');
    const host =
        (await getServerRequestHeader('x-forwarded-host')) ??
        (await getServerRequestHeader('host')) ??
        'localhost:3000';

    return `${protocol}://${host}${baseUrl}`;
}

/**
 * Forwards the browser request cookie when this code runs on the frontend server.
 * Browser requests let fetch attach cookies through `credentials: include` instead.
 */
async function forwardServerCookie(headers: Headers): Promise<void> {
    if (!import.meta.env.SSR || headers.has('cookie')) return;

    const cookie = await getServerRequestHeader('cookie');
    if (cookie) headers.set('cookie', cookie);
}

/** Builds the RequestInit object without coupling URL or auth concerns to it. */
function buildRequestConfig(
    headers: Headers,
    body: unknown,
    method: string | undefined,
    customConfig: Omit<ApiOptions, 'body' | 'params' | 'responseType'>,
    isFormData: boolean,
): RequestInit {
    return {
        method: method ?? (body ? 'POST' : 'GET'),
        credentials: customConfig.credentials ?? 'include',
        ...customConfig,
        headers,
        ...(body ? { body: isFormData ? (body as FormData) : JSON.stringify(body) } : {}),
    };
}

/** Converts successful responses to the requested type and normalizes API errors. */
async function parseResponse<T>(response: Response, responseType?: ApiOptions['responseType']): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Promise.reject({ status: response.status, ...errorData });
    }

    if (response.status === 204) return {} as T;
    if (responseType === 'blob') return (await response.blob()) as unknown as T;
    return response.json() as Promise<T>;
}

/**
 * Calls the API from either the browser or the frontend server.
 *
 * Browser flow: `credentials: include` asks the browser to attach its cookie.
 * Server flow: the incoming browser cookie is explicitly copied to the API request,
 * because Node has no browser cookie jar. Relative URLs are also made absolute for Node.
 */
export async function apiClient<T>(
    endpoint: string,
    { body, method, params, responseType, ...customConfig }: ApiOptions = {},
): Promise<T> {
    const headers = new Headers(customConfig.headers);
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (body && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    await forwardServerCookie(headers);

    const baseUrl = await resolveServerBaseUrl(BASE_URL);
    const url = `${baseUrl}/${trimSlashes(API_VERSION)}${endpoint}${buildQueryString(params)}`;
    const config = buildRequestConfig(headers, body, method, customConfig, isFormData);

    return parseResponse<T>(await fetch(url, config), responseType);
}
