import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
    minimumDate: Date;
    onChange: (value: string) => void;
    value: string;
};

function parseDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const date = new Date(`${value}:00`);

    return Number.isNaN(date.getTime()) ? undefined : date;
}

export function FulfillmentDateTimePicker({
    minimumDate,
    onChange,
    value,
}: Props) {
    const [open, setOpen] = useState(false);
    const date = parseDate(value);
    const time = date ? format(date, 'HH:mm') : '';

    function selectDate(nextDate: Date | undefined): void {
        if (!nextDate) {
            return;
        }

        onChange(`${format(nextDate, 'yyyy-MM-dd')}T${time || '10:00'}`);
        setOpen(false);
    }

    function selectTime(nextTime: string): void {
        const selectedDate = date ?? minimumDate;
        onChange(`${format(selectedDate, 'yyyy-MM-dd')}T${nextTime}`);
    }

    return (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        className="w-full justify-between font-normal"
                        type="button"
                        variant="outline"
                    >
                        {date
                            ? format(date, 'PPP', { locale: id })
                            : 'Pilih tanggal'}
                        <ChevronDownIcon className="size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-auto overflow-hidden p-0"
                >
                    <Calendar
                        captionLayout="dropdown"
                        defaultMonth={date ?? minimumDate}
                        disabled={{ before: minimumDate }}
                        mode="single"
                        onSelect={selectDate}
                        selected={date}
                    />
                </PopoverContent>
            </Popover>

            <Input
                aria-label="Jam penerimaan"
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                onChange={(event) => selectTime(event.target.value)}
                step="60"
                type="time"
                value={time}
            />
        </div>
    );
}
