import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const toDate = (value: string | null) => (value ? new Date(`${value}T00:00:00`) : undefined);
const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const monday = (date: Date) => {
    const result = new Date(date);
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
};

export function WeekDatePicker({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
    const selected = toDate(value);
    const weekEnd = selected ? new Date(selected) : undefined;
    weekEnd?.setDate(weekEnd.getDate() + 6);
    const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const label = selected && weekEnd ? `Week of ${formatDate(selected)} – ${formatDate(weekEnd)}` : 'No calendar week';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start font-normal">
                    <CalendarDays className="size-4" />
                    {label}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
                <Calendar
                    mode="single"
                    weekStartsOn={1}
                    selected={selected}
                    modifiers={selected && weekEnd ? { selectedWeek: { from: selected, to: weekEnd } } : undefined}
                    modifiersClassNames={{ selectedWeek: 'bg-accent text-accent-foreground' }}
                    onSelect={(date) => onChange(date ? toIsoDate(monday(date)) : null)}
                />
                {value && (
                    <Button type="button" variant="ghost" size="sm" className="mb-2 ml-2" onClick={() => onChange(null)}>
                        Clear week
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}
