import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className }: { className?: string }) {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    function toggleTheme() {
        const nextDark = !dark;
        document.documentElement.classList.toggle('dark', nextDark);
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        setDark(nextDark);
    }

    return (
        <Button
            className={cn(className)}
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Use ${dark ? 'light' : 'dark'} theme`}
        >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
    );
}
