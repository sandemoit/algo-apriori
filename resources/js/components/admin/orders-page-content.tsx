import { Link, router } from '@inertiajs/react';
import { Check, Eye, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { OrderDateRangeFilter } from '@/components/admin/order-date-range-filter';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatRupiah } from '@/lib/formatters';
import type { OrderStatus } from '@/types/cake-shop';

type Order = {
    id: number;
    order_number: string;
    customer_name_snapshot: string;
    customer_phone_snapshot: string;
    ordered_at: string;
    fulfillment_at: string;
    fulfillment_method: string;
    grand_total: string;
    status: OrderStatus;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    orders: { data: Order[]; links: PaginationLink[] };
    filters: Record<string, string | undefined>;
    summary: { total: number; completed: number; pending: number };
};

export function OrdersPageContent({ orders, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submitSearch(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        router.get(
            '/admin/orders',
            { ...filters, search },
            { preserveState: true, replace: true },
        );
    }

    function setFilter(key: string, value: string): void {
        router.get(
            '/admin/orders',
            { ...filters, search, [key]: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    }

    return (
        <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
                <SummaryCard label="Total order" value={summary.total} />
                <SummaryCard
                    label="Sudah dikerjakan"
                    value={summary.completed}
                    tone="success"
                />
                <SummaryCard
                    label="Belum selesai"
                    value={summary.pending}
                    tone="warning"
                />
            </section>

            <section>
                <form
                    onSubmit={submitSearch}
                    className="flex flex-wrap items-center gap-2"
                >
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                            placeholder="Nomor order, nama, atau WhatsApp"
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <OrderDateRangeFilter
                            from={filters.pickup_from}
                            to={filters.pickup_to}
                            onChange={(range) =>
                                router.get(
                                    '/admin/orders',
                                    {
                                        ...filters,
                                        search,
                                        pickup_from: range.from,
                                        pickup_to: range.to,
                                    },
                                    { preserveState: true, replace: true },
                                )
                            }
                        />
                    </div>
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(value) => setFilter('status', value)}
                    >
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Status order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            <SelectItem value="pending">Menunggu</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">
                                Dibatalkan
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit">Terapkan</Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.get('/admin/orders')}
                    >
                        Reset
                    </Button>
                </form>
            </section>

            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="p-4">Order / Pemesan</th>
                            <th className="p-4">Tanggal order</th>
                            <th className="p-4">Jadwal</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Metode</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.map((order) => (
                            <OrderRow key={order.id} order={order} />
                        ))}
                        {orders.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-12 text-center text-muted-foreground"
                                >
                                    Tidak ada order dengan filter tersebut.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap justify-end gap-1">
                {orders.links.map((link, index) => (
                    <Button
                        key={index}
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

function OrderRow({ order }: { order: Order }) {
    return (
        <tr className="border-t hover:bg-muted/30">
            <td className="p-4">
                <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium hover:text-primary"
                >
                    {order.order_number}
                </Link>
                <p className="mt-1">{order.customer_name_snapshot}</p>
                <p className="text-xs text-muted-foreground">
                    {order.customer_phone_snapshot}
                </p>
            </td>
            <td className="p-4">{formatDate(order.ordered_at)}</td>
            <td className="p-4">{formatDate(order.fulfillment_at)}</td>
            <td className="p-4 font-medium">
                {formatRupiah(Number(order.grand_total))}
            </td>
            <td className="p-4">{formatMethod(order.fulfillment_method)}</td>
            <td className="p-4">
                <div className="flex justify-end gap-2">
                    {order.status === 'pending' && (
                        <CompleteOrderButton orderId={order.id} />
                    )}
                    <Link href={`/admin/orders/${order.id}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            aria-label="Buka detail order"
                        >
                            <Eye className="size-4" />
                            Detail
                        </Button>
                    </Link>
                    {order.status !== 'completed' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Hapus order"
                            onClick={() =>
                                confirm('Hapus order ini?') &&
                                router.delete(`/admin/orders/${order.id}`)
                            }
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function SummaryCard({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'success' | 'warning';
}) {
    const classes = {
        default: 'border-border',
        success:
            'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/50',
        warning:
            'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/50',
    };

    return (
        <div className={`rounded-xl border p-4 ${classes[tone]}`}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}
function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatMethod(value: string): string {
    return (
        { pickup: 'Ambil di toko', delivery: 'Delivery / COD' }[value] ?? value
    );
}

function CompleteOrderButton({ orderId }: { orderId: number }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                aria-label="Selesaikan order dan konfirmasi pembayaran"
                onClick={() => setOpen(true)}
                size="sm"
                variant="default"
            >
                <Check className="size-4" />
                Selesaikan
            </Button>
            <Dialog onOpenChange={setOpen} open={open}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selesaikan pesanan?</DialogTitle>
                        <DialogDescription>
                            Pesanan akan ditandai selesai dan pembayaran
                            dikonfirmasi lunas.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => setOpen(false)}
                            type="button"
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() =>
                                router.patch(
                                    `/admin/orders/${orderId}/complete`,
                                    {},
                                    { onSuccess: () => setOpen(false) },
                                )
                            }
                            type="button"
                        >
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
