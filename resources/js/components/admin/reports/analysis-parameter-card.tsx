import { useForm } from '@inertiajs/react';
import { Play, SlidersHorizontal } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { OrderDateRangeFilter } from '@/components/admin/order-date-range-filter';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = {
    defaults: {
        minimum_support: number;
        minimum_confidence: number;
        minimum_lift: number;
        maximum_itemset: number;
        maximum_rules: number;
        minimum_occurrence: number;
    };
};

function today(): string {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    });
}

function startOfMonth(): string {
    const date = new Date();

    return new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString(
        'en-CA',
        { timeZone: 'Asia/Jakarta' },
    );
}

export function AnalysisParameterCard({ defaults }: Props) {
    const form = useForm({
        date_from: startOfMonth(),
        date_to: today(),
        minimum_support: defaults.minimum_support,
        minimum_confidence: defaults.minimum_confidence,
        minimum_lift: defaults.minimum_lift,
        maximum_itemset: String(defaults.maximum_itemset),
        maximum_rules: String(defaults.maximum_rules),
        minimum_occurrence: String(defaults.minimum_occurrence),
        sort_by: 'lift' as 'support' | 'confidence' | 'lift',
    });

    function selectPeriod(days: number): void {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        form.setData({
            ...form.data,
            date_from: start.toLocaleDateString('en-CA'),
            date_to: end.toLocaleDateString('en-CA'),
        });
    }

    function selectMonth(offset: number): void {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        form.setData({
            ...form.data,
            date_from: start.toLocaleDateString('en-CA'),
            date_to: end.toLocaleDateString('en-CA'),
        });
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post('/admin/apriori', { preserveScroll: true });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Parameter Analisis</CardTitle>
                <CardDescription>
                    Tentukan periode dan ambang pola pembelian yang ingin
                    ditampilkan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    id="run-apriori-analysis"
                    onSubmit={submit}
                    className="space-y-5"
                >
                    <div className="flex flex-wrap gap-2">
                        <QuickPeriod
                            label="7 hari terakhir"
                            onClick={() => selectPeriod(7)}
                        />
                        <QuickPeriod
                            label="30 hari terakhir"
                            onClick={() => selectPeriod(30)}
                        />
                        <QuickPeriod
                            label="Bulan ini"
                            onClick={() => selectMonth(0)}
                        />
                        <QuickPeriod
                            label="Bulan lalu"
                            onClick={() => selectMonth(-1)}
                        />
                        <QuickPeriod
                            label="3 bulan terakhir"
                            onClick={() => selectPeriod(90)}
                        />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        <Field
                            label="Periode transaksi"
                            hint="Hanya order selesai dan sudah lunas dalam periode ini yang dianalisis."
                        >
                            <OrderDateRangeFilter
                                from={form.data.date_from}
                                to={form.data.date_to}
                                placeholder="Pilih periode transaksi"
                                onChange={(range) =>
                                    form.setData({
                                        ...form.data,
                                        date_from: range.from ?? '',
                                        date_to: range.to ?? '',
                                    })
                                }
                            />
                            <FormError
                                message={
                                    form.errors.date_from ?? form.errors.date_to
                                }
                            />
                        </Field>
                        <PercentField
                            id="minimum_support"
                            label="Minimum support"
                            hint="Menentukan seberapa sering kombinasi produk harus muncul dalam seluruh transaksi."
                            value={form.data.minimum_support}
                            error={form.errors.minimum_support}
                            onChange={(value) =>
                                form.setData('minimum_support', value)
                            }
                        />
                        <PercentField
                            id="minimum_confidence"
                            label="Minimum confidence"
                            hint="Menentukan tingkat kemungkinan produk tujuan ikut dibeli setelah produk awal dibeli."
                            value={form.data.minimum_confidence}
                            error={form.errors.minimum_confidence}
                            onChange={(value) =>
                                form.setData('minimum_confidence', value)
                            }
                        />
                    </div>

                    <details className="group rounded-lg bg-muted/45 p-4">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                            <SlidersHorizontal className="size-4" />
                            Pengaturan lanjutan
                        </summary>
                        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <NumberField
                                id="minimum_lift"
                                label="Minimum lift"
                                hint="Lift 1 berarti netral; nilai di atas 1 menunjukkan asosiasi positif."
                                min={0}
                                step={0.1}
                                value={form.data.minimum_lift}
                                error={form.errors.minimum_lift}
                                onChange={(value) =>
                                    form.setData('minimum_lift', value)
                                }
                            />
                            <SelectField
                                id="maximum_itemset"
                                label="Panjang kombinasi maksimal"
                                hint="Batasi jumlah produk dalam satu kombinasi agar analisis tetap cepat."
                                value={form.data.maximum_itemset}
                                values={['2', '3', '4']}
                                onChange={(value) =>
                                    form.setData('maximum_itemset', value)
                                }
                            />
                            <NumberField
                                id="maximum_rules"
                                label="Maksimal jumlah aturan"
                                hint="Batas aman jumlah aturan yang disimpan dalam satu analisis."
                                min={1}
                                max={200}
                                step={1}
                                value={Number(form.data.maximum_rules)}
                                error={form.errors.maximum_rules}
                                onChange={(value) =>
                                    form.setData('maximum_rules', String(value))
                                }
                            />
                            <NumberField
                                id="minimum_occurrence"
                                label="Minimum kemunculan transaksi"
                                hint="Kombinasi harus muncul setidaknya sebanyak ini agar tidak hanya berupa kebetulan."
                                min={1}
                                step={1}
                                value={Number(form.data.minimum_occurrence)}
                                error={form.errors.minimum_occurrence}
                                onChange={(value) =>
                                    form.setData(
                                        'minimum_occurrence',
                                        String(value),
                                    )
                                }
                            />
                            <SelectField
                                id="sort_by"
                                label="Urutkan hasil berdasarkan"
                                hint="Menentukan prioritas urutan aturan pada hasil analisis."
                                value={form.data.sort_by}
                                values={['support', 'confidence', 'lift']}
                                onChange={(value) =>
                                    form.setData(
                                        'sort_by',
                                        value as
                                            | 'support'
                                            | 'confidence'
                                            | 'lift',
                                    )
                                }
                            />
                        </div>
                    </details>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Play className="size-4" />
                            {form.processing
                                ? 'Menjalankan analisis...'
                                : 'Jalankan Analisis'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function QuickPeriod({
    label,
    onClick,
}: {
    label: string;
    onClick: () => void;
}) {
    return (
        <Button type="button" size="sm" variant="outline" onClick={onClick}>
            {label}
        </Button>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <p className="min-h-10 text-xs leading-5 text-muted-foreground">
                {hint}
            </p>
            {children}
        </div>
    );
}

function PercentField({
    id,
    label,
    hint,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    hint: string;
    value: number;
    error?: string;
    onChange: (value: number) => void;
}) {
    return (
        <Field label={label} hint={hint}>
            <div className="relative">
                <Input
                    id={id}
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="pr-8"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                </span>
            </div>
            <FormError message={error} />
        </Field>
    );
}

function NumberField({
    id,
    label,
    hint,
    value,
    error,
    min,
    max,
    step,
    onChange,
}: {
    id: string;
    label: string;
    hint: string;
    value: number;
    error?: string;
    min: number;
    max?: number;
    step: number;
    onChange: (value: number) => void;
}) {
    return (
        <Field label={label} hint={hint}>
            <Input
                id={id}
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
            <FormError message={error} />
        </Field>
    );
}

function SelectField({
    id,
    label,
    hint,
    value,
    values,
    onChange,
}: {
    id: string;
    label: string;
    hint: string;
    value: string;
    values: string[];
    onChange: (value: string) => void;
}) {
    return (
        <Field label={label} hint={hint}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {values.map((item) => (
                        <SelectItem key={item} value={item}>
                            {item === 'support'
                                ? 'Support'
                                : item === 'confidence'
                                  ? 'Confidence'
                                  : item === 'lift'
                                    ? 'Lift'
                                    : item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}

function FormError({ message }: { message?: string }) {
    return message ? (
        <p className="text-xs text-destructive">{message}</p>
    ) : null;
}
