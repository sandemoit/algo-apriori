import 'react-day-picker/style.css';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';

type Props = {
    from?: string;
    to?: string;
    placeholder?: string;
    onChange: (range: { from?: string; to?: string }) => void;
};

function toDate(value?: string): Date | undefined {
    return value ? new Date(`${value}T00:00:00`) : undefined;
}

function toValue(value?: Date): string | undefined {
    return value ? format(value, 'yyyy-MM-dd') : undefined;
}

export function OrderDateRangeFilter({
    from,
    to,
    placeholder = 'Rentang jadwal pesanan',
    onChange,
}: Props) {
    const committedRange = useMemo<DateRange | undefined>(
        () => (from ? { from: toDate(from), to: toDate(to) } : undefined),
        [from, to],
    );
    const [draftRange, setDraftRange] = useState<DateRange | undefined>(
        committedRange,
    );
    const [open, setOpen] = useState(false);

    function select(next: DateRange | undefined): void {
        setDraftRange(next);
    }

    function apply(): void {
        if (!draftRange?.from || !draftRange.to) {
            return;
        }

        onChange({
            from: toValue(draftRange.from),
            to: toValue(draftRange.to),
        });
        setOpen(false);
    }

    function reset(): void {
        setDraftRange(undefined);
        setOpen(false);
        onChange({});
    }

    const label = !draftRange?.from
        ? placeholder
        : !draftRange.to
          ? `${format(draftRange.from, 'd MMM yyyy', { locale: id })} · pilih tanggal akhir`
          : `${format(draftRange.from, 'd MMM', { locale: id })} – ${format(draftRange.to, 'd MMM yyyy', { locale: id })}`;

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
                onClick={() => {
                    if (!open) {
                        setDraftRange(committedRange);
                    }

                    setOpen((value) => !value);
                }}
            >
                <CalendarDays className="size-4" />
                <span className="truncate">{label}</span>
            </Button>

            {open && (
                <div className="absolute left-0 z-30 mt-2 w-[320px] rounded-xl border bg-popover p-4 shadow-xl">
                    <DayPicker
                        className="order-date-range-picker"
                        mode="range"
                        selected={draftRange}
                        onSelect={select}
                        locale={id}
                        showOutsideDays
                    />
                    <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                        <Button type="button" variant="ghost" onClick={reset}>
                            Reset
                        </Button>
                        <Button
                            type="button"
                            disabled={!draftRange?.from || !draftRange.to}
                            onClick={apply}
                        >
                            Terapkan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
