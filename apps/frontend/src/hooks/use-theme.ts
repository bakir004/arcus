import * as React from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: string | null): value is Theme {
    return value === 'light' || value === 'dark' || value === 'auto';
}

function getStored(): Theme {
    if (typeof window === 'undefined') return 'auto';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : 'auto';
}

function getSystemTheme(): ResolvedTheme {
    return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function getResolvedTheme(theme = getStored()): ResolvedTheme {
    if (theme !== 'auto') return theme;
    return getSystemTheme();
}

function getAppliedTheme(): ResolvedTheme {
    if (typeof document === 'undefined') return 'light';
    const root = document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';
    return getResolvedTheme();
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const resolved = getResolvedTheme(theme);

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;

    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    window.localStorage.setItem(STORAGE_KEY, theme);
}

const subscribers = new Set<() => void>();

function emitChange() {
    for (const cb of subscribers) cb();
}

function subscribe(cb: () => void) {
    subscribers.add(cb);

    const media = window.matchMedia(MEDIA_QUERY);
    const onMediaChange = () => {
        if (getStored() === 'auto') {
            applyTheme('auto');
            emitChange();
        }
    };
    const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
            applyTheme(getStored());
            emitChange();
        }
    };

    media.addEventListener('change', onMediaChange);
    window.addEventListener('storage', onStorage);

    return () => {
        subscribers.delete(cb);
        media.removeEventListener('change', onMediaChange);
        window.removeEventListener('storage', onStorage);
    };
}

export function useTheme() {
    React.useLayoutEffect(() => {
        applyTheme(getStored());
        emitChange();
    }, []);

    const theme = React.useSyncExternalStore(subscribe, getStored, () => 'auto' as Theme);

    const isDark = React.useSyncExternalStore(
        subscribe,
        () => getAppliedTheme() === 'dark',
        () => false,
    );

    const setTheme = React.useCallback((next: Theme) => {
        applyTheme(next);
        emitChange();
    }, []);

    const toggle = React.useCallback(() => {
        setTheme(getAppliedTheme() === 'dark' ? 'light' : 'dark');
    }, [setTheme]);

    return { theme, setTheme, toggle, isDark };
}
