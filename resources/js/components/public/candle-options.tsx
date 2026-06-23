import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CandleType = 'number' | 'spiral' | null;

type Props = {
    type: CandleType;
    number: string;
    onTypeChange: (type: Exclude<CandleType, null>) => void;
    onNumberChange: (number: string) => void;
};

export function CandleOptions({
    type,
    number,
    onTypeChange,
    onNumberChange,
}: Props) {
    return (
        <fieldset className="mt-3 border-t pt-3 dark:border-slate-800">
            <legend className="text-sm font-medium">Jenis lilin</legend>

            <div className="mt-2 flex flex-wrap gap-3">
                <Label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-normal has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:has-[:checked]:border-sky-400 dark:has-[:checked]:bg-sky-950/40">
                    <input
                        checked={type === 'number'}
                        className="size-4 accent-blue-600"
                        name="candle-type"
                        onChange={() => onTypeChange('number')}
                        type="radio"
                        value="number"
                    />
                    Angka
                </Label>

                <Label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-normal has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:has-[:checked]:border-sky-400 dark:has-[:checked]:bg-sky-950/40">
                    <input
                        checked={type === 'spiral'}
                        className="size-4 accent-blue-600"
                        name="candle-type"
                        onChange={() => onTypeChange('spiral')}
                        type="radio"
                        value="spiral"
                    />
                    Spiral
                </Label>
            </div>

            {type === 'number' && (
                <div className="mt-3 max-w-48">
                    <Label htmlFor="candle-number">Angka pada lilin</Label>
                    <Input
                        id="candle-number"
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(event) =>
                            onNumberChange(
                                event.target.value.replace(/\D/g, ''),
                            )
                        }
                        placeholder="Contoh: 21"
                        value={number}
                    />
                </div>
            )}
        </fieldset>
    );
}
