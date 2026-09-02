import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
    const { toggle, isDark } = useTheme();

    return (
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {isDark ? (
                <Sun className="size-4 animate-in fade-in-0 zoom-in-75 duration-200" />
            ) : (
                <Moon className="size-4 animate-in fade-in-0 zoom-in-75 duration-200" />
            )}
        </Button>
    );
}
