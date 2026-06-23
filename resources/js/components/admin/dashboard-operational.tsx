import { Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/formatters';

type Order = {
    id: number;
    order_number: string;
    customer_name_snapshot: string;
    fulfillment_at: string;
    grand_total: string;
    status: 'pending' | 'completed' | 'cancelled';
};
type Props = {
    metrics: {
        orders_today: number;
        pickup_today: number;
        completed_today: number;
        pending_orders: number;
        revenue: string;
    };
    latestOrders: Order[];
    upcomingOrders: Order[];
    popularItems: Array<{ name: string; total: number }>;
};

export function DashboardOperational({
    metrics,
    latestOrders,
    upcomingOrders,
    popularItems,
}: Props) {
    const cards = [
        ['Order masuk hari ini', metrics.orders_today],
        ['Jadwal hari ini', metrics.pickup_today],
        ['Selesai hari ini', metrics.completed_today],
        ['Belum selesai', metrics.pending_orders],
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <PageHeader
                title="Dashboard"
                description="Ringkasan operasional toko dan pesanan yang perlu ditangani."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value]) => (
                    <Card key={String(label)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Omzet order selesai</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-semibold">
                        {formatRupiah(Number(metrics.revenue))}
                    </p>
                </CardContent>
            </Card>
            <div className="grid gap-6 xl:grid-cols-2">
                <OrderList title="Order terbaru" orders={latestOrders} />
                <OrderList title="Jadwal terdekat" orders={upcomingOrders} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Item tambahan terpopuler</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {popularItems.map((item) => (
                        <div className="rounded-lg border p-3" key={item.name}>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {item.total} terjual
                            </p>
                        </div>
                    ))}
                    {popularItems.length === 0 && (
                        <p className="text-muted-foreground">
                            Belum ada data item tambahan.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
function OrderList({ title, orders }: { title: string; orders: Order[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {orders.map((order) => (
                    <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        key={order.id}
                    >
                        <div>
                            <p className="font-medium">
                                {order.customer_name_snapshot}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {order.order_number} ·{' '}
                                {new Date(order.fulfillment_at).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="mb-1 text-sm font-medium">
                                {formatRupiah(Number(order.grand_total))}
                            </p>
                            <StatusBadge status={order.status} />
                        </div>
                    </Link>
                ))}
                {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Tidak ada order.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
