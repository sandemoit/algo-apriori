import { Head, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { CandleOptions } from '@/components/public/candle-options';
import { FulfillmentDateTimePicker } from '@/components/public/fulfillment-date-time-picker';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Catalog = {
    id: number;
    code?: string | null;
    name: string;
    base_price?: string;
    price_adjustment?: string;
    price?: string;
    unit?: string;
};

type Props = {
    sizes: Catalog[];
    shapes: Catalog[];
    items: Catalog[];
    settings: {
        minimum_pickup_days: number;
        opening_time: string;
        closing_time: string;
        delivery_fee: string;
    };
};

type FulfillmentMethod = 'pickup' | 'delivery';

type OrderItemPayload = {
    id: number;
    quantity: number;
    configuration?: {
        type: 'number' | 'spiral';
        number?: string;
    };
};

const money = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const numeric = (value?: string): number => Number(value ?? 0);

const isCandleItem = (item: Catalog): boolean =>
    item.code === 'candle' ||
    item.name.trim().toLocaleLowerCase('id-ID') === 'lilin';

const scheduleLabel = (method: FulfillmentMethod): string =>
    method === 'pickup' ? 'Jadwal pickup' : 'Jadwal kirim';

function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function defaultFulfillmentAt(settings: Props['settings']): Date {
    const date = new Date();
    date.setSeconds(0, 0);
    date.setDate(date.getDate() + settings.minimum_pickup_days);

    const [openingHours, openingMinutes] = settings.opening_time
        .split(':')
        .map(Number);
    const [closingHours, closingMinutes] = settings.closing_time
        .split(':')
        .map(Number);
    const openingTime = openingHours * 60 + openingMinutes;
    const closingTime = closingHours * 60 + closingMinutes;
    const currentTime = date.getHours() * 60 + date.getMinutes();

    if (currentTime < openingTime) {
        date.setHours(openingHours, openingMinutes, 0, 0);

        return date;
    }

    if (currentTime > closingTime) {
        date.setDate(date.getDate() + 1);
        date.setHours(openingHours, openingMinutes, 0, 0);
    }

    return date;
}

export default function CreateOrder({ sizes, shapes, items, settings }: Props) {
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [candleType, setCandleType] = useState<'number' | 'spiral' | null>(
        null,
    );
    const [candleNumber, setCandleNumber] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [initialFulfillmentAt] = useState(() =>
        defaultFulfillmentAt(settings),
    );
    const [minimumFulfillmentDate] = useState(() => {
        const date = new Date(initialFulfillmentAt);
        date.setHours(0, 0, 0, 0);

        return date;
    });
    const form = useForm({
        submission_token: crypto.randomUUID(),
        customer_name: '',
        customer_phone: '',
        fulfillment_method: 'pickup' as FulfillmentMethod,
        fulfillment_at: formatDateTimeLocal(initialFulfillmentAt),
        delivery_address: '',
        cake_size_id: '',
        cake_shape_id: '',
        cake_text: '',
        age_text: '',
        base_color: '',
        decoration_color: '',
        character_theme: '',
        customer_notes: '',
        reference_image: null as File | null,
        items: [] as OrderItemPayload[],
        website: '',
    });

    const selectedSize = sizes.find(
        (item) => item.id === Number(form.data.cake_size_id),
    );
    const selectedShape = shapes.find(
        (item) => item.id === Number(form.data.cake_shape_id),
    );
    const cakeTotal =
        numeric(selectedSize?.base_price) +
        numeric(selectedShape?.price_adjustment);
    const addOnTotal = useMemo(
        () =>
            items.reduce(
                (total, item) =>
                    total + numeric(item.price) * (quantities[item.id] ?? 0),
                0,
            ),
        [items, quantities],
    );
    const requiresAddress = form.data.fulfillment_method !== 'pickup';
    const deliveryFee = requiresAddress ? numeric(settings.delivery_fee) : 0;

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            delivery_address: requiresAddress ? data.delivery_address : '',
            items: Object.entries(quantities)
                .filter(([, quantity]) => quantity > 0)
                .map(([id, quantity]) => {
                    const item = items.find(
                        (catalogItem) => catalogItem.id === Number(id),
                    );
                    const payload: OrderItemPayload = {
                        id: Number(id),
                        quantity,
                    };

                    if (item && isCandleItem(item) && candleType === 'number') {
                        payload.configuration = {
                            type: candleType,
                            number: candleNumber,
                        };
                    }

                    if (item && isCandleItem(item) && candleType === 'spiral') {
                        payload.configuration = { type: candleType };
                    }

                    return payload;
                }),
        }));
        form.post('/order');
    }

    function updateImage(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0] ?? null;
        form.setData('reference_image', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function updateQuantity(id: number, change: number): void {
        setQuantities((current) => ({
            ...current,
            [id]: Math.max(0, (current[id] ?? 0) + change),
        }));
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title="Pesan Kue" />
            <PublicNavbar />

            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="mb-8 max-w-2xl">
                    <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
                        PESAN KUE
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold">
                        Buat kue untuk momen spesialmu.
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                        Pilih metode penerimaan, lengkapi detail kue, lalu kami
                        proses pesananmu.
                    </p>
                </div>

                <form
                    className="grid gap-6 lg:grid-cols-[1fr_360px]"
                    onSubmit={submit}
                >
                    <div className="space-y-6">
                        <Section title="Data pemesan dan penerimaan">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    error={form.errors.customer_name}
                                    label="Nama pemesan"
                                >
                                    <Input
                                        value={form.data.customer_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'customer_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    error={form.errors.customer_phone}
                                    label="Nomor WhatsApp"
                                >
                                    <Input
                                        placeholder="0812..."
                                        value={form.data.customer_phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'customer_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>

                            <fieldset className="mt-5">
                                <legend className="text-sm font-medium">
                                    Metode penerimaan
                                </legend>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {(
                                        [
                                            ['pickup', 'Ambil di toko'],
                                            ['delivery', 'Delivery / COD'],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <label
                                            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:has-[:checked]:border-sky-400 dark:has-[:checked]:bg-sky-950/40"
                                            key={value}
                                        >
                                            <input
                                                checked={
                                                    form.data
                                                        .fulfillment_method ===
                                                    value
                                                }
                                                className="accent-blue-600"
                                                name="fulfillment_method"
                                                onChange={() =>
                                                    form.setData(
                                                        'fulfillment_method',
                                                        value,
                                                    )
                                                }
                                                type="radio"
                                                value={value}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Field
                                    error={form.errors.fulfillment_at}
                                    label={scheduleLabel(
                                        form.data.fulfillment_method,
                                    )}
                                >
                                    <FulfillmentDateTimePicker
                                        minimumDate={minimumFulfillmentDate}
                                        onChange={(value) =>
                                            form.setData(
                                                'fulfillment_at',
                                                value,
                                            )
                                        }
                                        value={form.data.fulfillment_at}
                                    />
                                </Field>
                                {requiresAddress && (
                                    <Field
                                        error={form.errors.delivery_address}
                                        label="Alamat lengkap"
                                    >
                                        <Textarea
                                            className="min-h-24"
                                            onChange={(event) =>
                                                form.setData(
                                                    'delivery_address',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, dan patokan"
                                            value={form.data.delivery_address}
                                        />
                                    </Field>
                                )}
                            </div>
                        </Section>

                        <Section title="Detail kue">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <CatalogSelect
                                    label="Ukuran"
                                    onChange={(value) =>
                                        form.setData('cake_size_id', value)
                                    }
                                    options={sizes}
                                    priceKey="base_price"
                                    value={form.data.cake_size_id}
                                />
                                <CatalogSelect
                                    label="Bentuk"
                                    onChange={(value) =>
                                        form.setData('cake_shape_id', value)
                                    }
                                    options={shapes}
                                    priceKey="price_adjustment"
                                    value={form.data.cake_shape_id}
                                />
                                <Field label="Warna dasar">
                                    <Input
                                        onChange={(event) =>
                                            form.setData(
                                                'base_color',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: putih"
                                        value={form.data.base_color}
                                    />
                                </Field>
                                <Field label="Warna hiasan">
                                    <Input
                                        onChange={(event) =>
                                            form.setData(
                                                'decoration_color',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: pink dan emas"
                                        value={form.data.decoration_color}
                                    />
                                </Field>
                                <Field label="Tulisan pada kue">
                                    <Input
                                        onChange={(event) =>
                                            form.setData(
                                                'cake_text',
                                                event.target.value,
                                            )
                                        }
                                        value={form.data.cake_text}
                                    />
                                </Field>
                                <Field label="Tema / karakter">
                                    <Input
                                        onChange={(event) =>
                                            form.setData(
                                                'character_theme',
                                                event.target.value,
                                            )
                                        }
                                        value={form.data.character_theme}
                                    />
                                </Field>
                            </div>

                            <div className="mt-4">
                                <Field
                                    error={form.errors.reference_image}
                                    label="Foto referensi"
                                >
                                    <Input
                                        accept="image/*"
                                        onChange={updateImage}
                                        type="file"
                                    />
                                </Field>
                                {preview && (
                                    <img
                                        alt="Preview referensi"
                                        className="mt-4 max-h-56 rounded-xl object-cover"
                                        src={preview}
                                    />
                                )}
                            </div>
                        </Section>

                        <Section title="Item tambahan">
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        className="rounded-xl border p-3 dark:border-slate-800"
                                        key={item.id}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {money(numeric(item.price))}{' '}
                                                    / {item.unit}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            -1,
                                                        )
                                                    }
                                                    size="icon"
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    <Minus className="size-4" />
                                                </Button>
                                                <span className="w-5 text-center">
                                                    {quantities[item.id] ?? 0}
                                                </span>
                                                <Button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            1,
                                                        )
                                                    }
                                                    size="icon"
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    <Plus className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {isCandleItem(item) &&
                                            (quantities[item.id] ?? 0) > 0 && (
                                                <CandleOptions
                                                    number={candleNumber}
                                                    onNumberChange={
                                                        setCandleNumber
                                                    }
                                                    onTypeChange={setCandleType}
                                                    type={candleType}
                                                />
                                            )}
                                    </div>
                                ))}
                            </div>
                            {form.errors.items && (
                                <p className="mt-3 text-sm text-red-600">
                                    {form.errors.items}
                                </p>
                            )}
                        </Section>

                        <Section title="Catatan">
                            <Field label="Catatan tambahan">
                                <Textarea
                                    className="min-h-24"
                                    onChange={(event) =>
                                        form.setData(
                                            'customer_notes',
                                            event.target.value,
                                        )
                                    }
                                    value={form.data.customer_notes}
                                />
                            </Field>
                            <input
                                autoComplete="off"
                                className="hidden"
                                onChange={(event) =>
                                    form.setData('website', event.target.value)
                                }
                                tabIndex={-1}
                                value={form.data.website}
                            />
                        </Section>
                    </div>

                    <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-semibold">
                            Ringkasan pesanan
                        </h2>
                        <Row label="Harga kue" value={money(cakeTotal)} />
                        <Row label="Item tambahan" value={money(addOnTotal)} />
                        <Row label="Ongkir" value={money(deliveryFee)} />
                        <div className="my-4 border-t dark:border-slate-800" />
                        <Row
                            label="Total"
                            strong
                            value={money(cakeTotal + addOnTotal + deliveryFee)}
                        />
                        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Total dan ongkir dihitung ulang oleh sistem. Jadwal
                            tersedia pukul {settings.opening_time}–
                            {settings.closing_time}.
                        </p>
                        <Button
                            className="mt-5 w-full"
                            disabled={form.processing}
                            type="submit"
                        >
                            {form.processing
                                ? 'Membuat pesanan...'
                                : 'Buat pesanan'}
                        </Button>
                    </aside>
                </form>
            </main>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-2 text-sm font-medium">
            {label}
            {children}
            {error && (
                <span className="text-xs font-normal text-red-600">
                    {error}
                </span>
            )}
        </label>
    );
}

function CatalogSelect({
    label,
    value,
    onChange,
    options,
    priceKey,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Catalog[];
    priceKey: 'base_price' | 'price_adjustment';
}) {
    return (
        <Field label={label}>
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Pilih ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>{label}</SelectLabel>
                        {options.map((option) => (
                            <SelectItem
                                key={option.id}
                                value={String(option.id)}
                            >
                                {option.name}{' '}
                                {numeric(option[priceKey]) > 0
                                    ? `(+${money(numeric(option[priceKey]))})`
                                    : ''}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </Field>
    );
}

function Row({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div
            className={`mt-3 flex justify-between ${strong ? 'text-lg font-semibold' : 'text-sm'}`}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
