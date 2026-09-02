import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ThemeToggle } from '@/components/common/theme-toggle';

export function AuthShell({ children }: { children: ReactNode }) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-medium">
                        <img src="/logo.png" alt="Arcus logo" className="size-6 rounded-md" />
                        Arcus
                    </Link>
                    <ThemeToggle />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">{children}</div>
                </div>
            </div>
            <div className="relative hidden overflow-hidden bg-background lg:block">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 800 1000"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 h-full w-full"
                >
                    <defs>
                        <linearGradient id="art-bg" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="var(--background)" />
                            <stop offset="0.48" stopColor="var(--muted)" />
                            <stop offset="1" stopColor="var(--accent)" />
                        </linearGradient>
                        <radialGradient id="art-pink" cx="50%" cy="50%" r="50%">
                            <stop offset="0" stopColor="var(--primary)" />
                            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="art-cyan" cx="50%" cy="50%" r="50%">
                            <stop offset="0" stopColor="var(--tertiary)" />
                            <stop offset="1" stopColor="var(--tertiary)" stopOpacity="0" />
                        </radialGradient>
                        <filter id="art-glow">
                            <feGaussianBlur stdDeviation="24" />
                        </filter>
                    </defs>
                    <rect width="800" height="1000" fill="url(#art-bg)" />
                    <circle cx="110" cy="170" r="260" fill="url(#art-pink)" opacity="0.85" filter="url(#art-glow)" />
                    <circle cx="710" cy="780" r="300" fill="url(#art-cyan)" opacity="0.7" filter="url(#art-glow)" />
                    <path
                        d="M-80 700C80 510 120 810 270 625S470 255 620 420s130 120 280-60"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="88"
                        opacity="0.8"
                    />
                    <path
                        d="M-100 330C100 470 185 95 350 270s240 310 550 90"
                        fill="none"
                        stroke="var(--foreground)"
                        strokeWidth="120"
                        opacity="0.72"
                    />
                    <path
                        d="M-70 890C160 730 245 970 390 760s260-120 500 40"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="34"
                        opacity="0.9"
                    />
                    <path d="M70 0L760 1000M310-80L840 690" stroke="var(--foreground)" strokeWidth="2" opacity="0.2" />
                    <circle
                        cx="590"
                        cy="210"
                        r="92"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        opacity="0.8"
                    />
                    <circle
                        cx="590"
                        cy="210"
                        r="126"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="1"
                        opacity="0.5"
                    />
                </svg>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-64 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-background/20" />
            </div>
        </div>
    );
}
