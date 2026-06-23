import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/formatters';

const methodLabel = (method: string): string =>
    ({ pickup: 'Ambil di toko', delivery: 'Delivery / COD' })[method] ?? method;

export default function OrderDetail({ order }: { order: any }) {
    const [confirming, setConfirming] = useState(false);
    const scheduleLabel =
        order.fulfillment_method === 'pickup'
            ? 'Jadwal pickup'
            : 'Jadwal kirim';

    function complete(): void {
        router.patch(
            `/admin/orders/${order.id}/complete`,
            {},
            { onSuccess: () => setConfirming(false) },
        );
    }

    return (
        <>
            <Head title={order.order_number} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    description="Detail pesanan, pembayaran, dan riwayat operasional."
                    title={order.order_number}
                />
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <Badge
                        variant={
                            order.payment_status === 'paid'
                                ? 'default'
                                : 'secondary'
                        }
                    >
                        {order.payment_status === 'paid'
                            ? 'Pembayaran lunas'
                            : 'Belum lunas'}
                    </Badge>
                    {order.status === 'pending' && (
                        <Button onClick={() => setConfirming(true)}>
                            Konfirmasi selesai & pembayaran
                        </Button>
                    )}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pemesan dan penerimaan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium">
                                    {order.customer_name_snapshot}
                                </p>
                                <p className="text-muted-foreground">
                                    {order.customer_phone_snapshot}
                                </p>
                            </div>
                            <Detail
                                label="Metode"
                                value={methodLabel(order.fulfillment_method)}
                            />
                            <Detail
                                label={scheduleLabel}
                                value={new Date(
                                    order.fulfillment_at,
                                ).toLocaleString('id-ID')}
                            />
                            {order.delivery_address && (
                                <Detail
                                    label="Alamat lengkap"
                                    value={order.delivery_address}
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <Detail
                                label="Status"
                                value={
                                    order.payment_status === 'paid'
                                        ? 'Lunas'
                                        : 'Belum dikonfirmasi'
                                }
                            />
                            {order.paid_at && (
                                <Detail
                                    label="Dikonfirmasi pada"
                                    value={new Date(
                                        order.paid_at,
                                    ).toLocaleString('id-ID')}
                                />
                            )}
                            {order.paid_by && (
                                <Detail
                                    label="Dikonfirmasi oleh"
                                    value={order.paid_by.name}
                                />
                            )}
                            <Detail
                                label="Status order"
                                value={
                                    order.status === 'completed'
                                        ? 'Selesai'
                                        : 'Menunggu'
                                }
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail kue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <Detail
                                label="Ukuran"
                                value={order.cake_size_snapshot}
                            />
                            <Detail
                                label="Bentuk"
                                value={order.cake_shape_snapshot}
                            />
                            <Detail
                                label="Warna dasar"
                                value={order.base_color}
                            />
                            <Detail
                                label="Warna hiasan"
                                value={order.decoration_color}
                            />
                            <Detail label="Tulisan" value={order.cake_text} />
                            <Detail
                                label="Tema"
                                value={order.character_theme}
                            />
                            {order.reference_image_path && (
                                <img
                                    alt="Referensi desain kue"
                                    className="max-h-64 rounded-lg object-cover"
                                    src={`/invoice/${order.public_token}/reference-image`}
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Rincian harga</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {order.additional_items.map((item: any) => (
                                <div
                                    className="flex justify-between"
                                    key={item.id}
                                >
                                    <span>
                                        {item.item_name_snapshot} ×{' '}
                                        {item.quantity}
                                    </span>
                                    <span>
                                        {formatRupiah(Number(item.subtotal))}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t pt-3">
                                <Detail
                                    label="Harga kue"
                                    value={formatRupiah(
                                        Number(order.cake_price),
                                    )}
                                />
                                <Detail
                                    label="Item tambahan"
                                    value={formatRupiah(
                                        Number(order.additional_items_total),
                                    )}
                                />
                                <Detail
                                    label="Ongkir"
                                    value={formatRupiah(
                                        Number(order.delivery_fee),
                                    )}
                                />
                                <div className="mt-3 flex justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>
                                        {formatRupiah(
                                            Number(order.grand_total),
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Dialog onOpenChange={setConfirming} open={confirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selesaikan pesanan?</DialogTitle>
                        <DialogDescription>
                            Pesanan akan ditandai selesai dan pembayaran
                            dikonfirmasi lunas. Tindakan ini tidak dapat
                            dibatalkan dari halaman ini.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => setConfirming(false)}
                            type="button"
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button onClick={complete} type="button">
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    if (!value) {
        return null;
    }

    return (
        <div>
            <p className="text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    );
}
