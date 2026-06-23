import { useForm } from '@inertiajs/react';
import { MessageCircleMore, Store, Truck } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/formatters';

type Settings = {
    store_name: string;
    store_phone: string;
    admin_whatsapp: string;
    store_address: string;
    customer_order_template: string;
    admin_order_template: string;
    public_order_enabled: boolean;
    minimum_pickup_days: number;
    opening_time: string;
    closing_time: string;
    delivery_fee: string;
};

type Props = {
    settings: Settings;
    sizes: Array<{
        id: number;
        name: string;
        base_price: string;
        is_active: boolean;
    }>;
    shapes: Array<{
        id: number;
        name: string;
        price_adjustment: string;
        is_active: boolean;
    }>;
    items: Array<{
        id: number;
        name: string;
        price: string;
        unit: string;
        is_active: boolean;
    }>;
};

const placeholders = [
    '{customer_name}',
    '{customer_phone}',
    '{order_number}',
    '{fulfillment_date}',
    '{fulfillment_time}',
    '{fulfillment_method}',
    '{delivery_address}',
    '{grand_total}',
    '{invoice_url}',
];

const sampleValues: Record<string, string> = {
    '{customer_name}': 'Nadia Putri',
    '{customer_phone}': '6281234567890',
    '{order_number}': 'ORD-202606-0001',
    '{fulfillment_date}': '25 Jun 2026',
    '{fulfillment_time}': '10:00',
    '{fulfillment_method}': 'Delivery / COD',
    '{delivery_address}': 'Jl. Mawar No. 21, Bandung',
    '{grand_total}': '175.000',
    '{invoice_url}': 'https://toko.test/invoice/xxx',
};

export function SettingsPageContent({ settings, sizes, shapes, items }: Props) {
    const form = useForm(settings);

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.put('/admin/settings');
    }

    return (
        <div className="space-y-6">
            <form className="space-y-6" onSubmit={submit}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Store className="size-5 text-primary" />
                                <CardTitle>
                                    Profil dan operasional toko
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Informasi yang digunakan pada invoice dan jadwal
                                pesanan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <SettingField
                                label="Nama toko"
                                htmlFor="store-name"
                            >
                                <Input
                                    id="store-name"
                                    onChange={(event) =>
                                        form.setData(
                                            'store_name',
                                            event.target.value,
                                        )
                                    }
                                    value={form.data.store_name}
                                />
                            </SettingField>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <SettingField
                                    label="Telepon toko"
                                    htmlFor="store-phone"
                                >
                                    <Input
                                        id="store-phone"
                                        onChange={(event) =>
                                            form.setData(
                                                'store_phone',
                                                event.target.value,
                                            )
                                        }
                                        value={form.data.store_phone}
                                    />
                                </SettingField>
                                <SettingField
                                    label="WhatsApp admin"
                                    htmlFor="admin-whatsapp"
                                >
                                    <Input
                                        id="admin-whatsapp"
                                        onChange={(event) =>
                                            form.setData(
                                                'admin_whatsapp',
                                                event.target.value,
                                            )
                                        }
                                        value={form.data.admin_whatsapp}
                                    />
                                </SettingField>
                            </div>
                            <SettingField
                                label="Alamat toko"
                                htmlFor="store-address"
                            >
                                <Textarea
                                    id="store-address"
                                    onChange={(event) =>
                                        form.setData(
                                            'store_address',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Alamat lengkap toko"
                                    value={form.data.store_address}
                                />
                            </SettingField>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <SettingField
                                    label="Minimum hari pemesanan"
                                    htmlFor="minimum-days"
                                >
                                    <Input
                                        id="minimum-days"
                                        min="0"
                                        onChange={(event) =>
                                            form.setData(
                                                'minimum_pickup_days',
                                                Number(event.target.value),
                                            )
                                        }
                                        type="number"
                                        value={form.data.minimum_pickup_days}
                                    />
                                </SettingField>
                                <SettingField
                                    label="Tarif ongkir tetap"
                                    htmlFor="delivery-fee"
                                >
                                    <Input
                                        id="delivery-fee"
                                        min="0"
                                        onChange={(event) =>
                                            form.setData(
                                                'delivery_fee',
                                                event.target.value,
                                            )
                                        }
                                        type="number"
                                        value={form.data.delivery_fee}
                                    />
                                </SettingField>
                                <SettingField
                                    label="Jam buka"
                                    htmlFor="opening-time"
                                >
                                    <Input
                                        id="opening-time"
                                        onChange={(event) =>
                                            form.setData(
                                                'opening_time',
                                                event.target.value,
                                            )
                                        }
                                        type="time"
                                        value={form.data.opening_time}
                                    />
                                </SettingField>
                                <SettingField
                                    label="Jam tutup"
                                    htmlFor="closing-time"
                                >
                                    <Input
                                        id="closing-time"
                                        onChange={(event) =>
                                            form.setData(
                                                'closing_time',
                                                event.target.value,
                                            )
                                        }
                                        type="time"
                                        value={form.data.closing_time}
                                    />
                                </SettingField>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageCircleMore className="size-5 text-primary" />
                                <CardTitle>Template pesan WhatsApp</CardTitle>
                            </div>
                            <CardDescription>
                                Pesan dibuat saat order tersimpan, lalu dikirim
                                melalui antrean WhatsApp.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border bg-muted/40 p-4">
                                <p className="text-sm font-medium">
                                    Placeholder yang tersedia
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {placeholders.map((placeholder) => (
                                        <code
                                            className="rounded-md bg-background px-2 py-1 text-xs text-muted-foreground"
                                            key={placeholder}
                                        >
                                            {placeholder}
                                        </code>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                    Placeholder diganti otomatis saat notifikasi
                                    dikirim. Jangan ubah teks di dalam tanda
                                    kurung kurawal.
                                </p>
                            </div>
                            <TemplateField
                                label="Pesan untuk pelanggan"
                                id="customer-order-template"
                                onChange={(value) =>
                                    form.setData(
                                        'customer_order_template',
                                        value,
                                    )
                                }
                                value={form.data.customer_order_template}
                            />
                            <TemplateField
                                label="Pesan untuk admin"
                                id="admin-order-template"
                                onChange={(value) =>
                                    form.setData('admin_order_template', value)
                                }
                                value={form.data.admin_order_template}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="flex justify-end">
                    <Button disabled={form.processing} type="submit">
                        {form.processing ? 'Menyimpan...' : 'Simpan pengaturan'}
                    </Button>
                </div>
            </form>

            <section>
                <div className="mb-4 flex items-center gap-2">
                    <Truck className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Master katalog</h2>
                </div>
                <div className="grid gap-6 xl:grid-cols-3">
                    <Catalog
                        title="Ukuran kue"
                        rows={sizes.map((item) => [
                            item.name,
                            formatRupiah(Number(item.base_price)),
                            item.is_active,
                        ])}
                    />
                    <Catalog
                        title="Bentuk kue"
                        rows={shapes.map((item) => [
                            item.name,
                            formatRupiah(Number(item.price_adjustment)),
                            item.is_active,
                        ])}
                    />
                    <Catalog
                        title="Item tambahan"
                        rows={items.map((item) => [
                            item.name,
                            `${formatRupiah(Number(item.price))} / ${item.unit}`,
                            item.is_active,
                        ])}
                    />
                </div>
            </section>
        </div>
    );
}

function SettingField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}

function TemplateField({
    label,
    id,
    value,
    onChange,
}: {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-3">
            <Label htmlFor={id}>{label}</Label>
            <Textarea
                className="min-h-40 font-mono text-sm leading-6"
                id={id}
                onChange={(event) => onChange(event.target.value)}
                value={value}
            />
            <MessagePreview value={value} />
        </div>
    );
}

function MessagePreview({ value }: { value: string }) {
    const message = Object.entries(sampleValues).reduce(
        (result, [placeholder, replacement]) =>
            result.replaceAll(placeholder, replacement),
        value,
    );

    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
                Preview pesan
            </p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">
                {message || 'Tulis template pesan untuk melihat preview.'}
            </p>
        </div>
    );
}

function Catalog({
    title,
    rows,
}: {
    title: string;
    rows: Array<[string, string, boolean]>;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.map(([name, price, active]) => (
                    <div
                        className="flex justify-between rounded-lg border p-3"
                        key={name}
                    >
                        <span className="font-medium">{name}</span>
                        <span className="text-sm text-muted-foreground">
                            {price} · {active ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Belum ada data.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
