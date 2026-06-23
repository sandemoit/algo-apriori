import { Head, Link } from '@inertiajs/react';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';

const money = (value: string | number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));
const methodLabel = (method: string): string =>
    ({ pickup: 'Ambil di toko', delivery: 'Delivery / COD' })[method] ?? method;

export default function Invoice({
    order,
    maskedPhone,
}: {
    order: any;
    maskedPhone: string;
}) {
    const scheduleLabel =
        order.fulfillment_method === 'pickup'
            ? 'Jadwal pickup'
            : 'Jadwal kirim';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={`Invoice ${order.order_number}`} />
            <PublicNavbar />
            <main className="mx-auto max-w-2xl px-4 py-10">
                <article className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
                        INVOICE PESANAN
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold">
                        {order.order_number}
                    </h1>
                    <div className="my-6 grid gap-4 border-y py-5 text-sm sm:grid-cols-2 dark:border-slate-800">
                        <div>
                            <p className="text-slate-500">Pemesan</p>
                            <p className="font-medium">
                                {order.customer_name_snapshot}
                            </p>
                            <p>{maskedPhone}</p>
                        </div>
                        <div>
                            <p className="text-slate-500">{scheduleLabel}</p>
                            <p className="font-medium">
                                {new Date(order.fulfillment_at).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                            <p>{methodLabel(order.fulfillment_method)}</p>
                        </div>
                        {order.delivery_address && (
                            <div className="sm:col-span-2">
                                <p className="text-slate-500">
                                    Alamat pengiriman
                                </p>
                                <p>{order.delivery_address}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 text-sm">
                        <p>
                            {order.cake_size_snapshot} ·{' '}
                            {order.cake_shape_snapshot}
                        </p>
                        {order.base_color && (
                            <p>Warna dasar: {order.base_color}</p>
                        )}
                        {order.decoration_color && (
                            <p>Warna hiasan: {order.decoration_color}</p>
                        )}
                        {order.cake_text && <p>Tulisan: {order.cake_text}</p>}
                        {order.character_theme && (
                            <p>Tema: {order.character_theme}</p>
                        )}
                        {order.reference_image_path && (
                            <img
                                alt="Referensi desain kue"
                                className="mt-4 max-h-64 rounded-xl object-cover"
                                src={`/invoice/${order.public_token}/reference-image`}
                            />
                        )}
                        {order.additional_items.map((item: any) => (
                            <div className="flex justify-between" key={item.id}>
                                <span>
                                    {item.item_name_snapshot} × {item.quantity}
                                </span>
                                <span>{money(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2 border-t pt-4 text-sm dark:border-slate-800">
                        <div className="flex justify-between">
                            <span>Harga kue</span>
                            <span>{money(order.cake_price)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ongkir</span>
                            <span>{money(order.delivery_fee)}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{money(order.grand_total)}</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                            Informasi pembayaran
                        </p>
                        <p className="mt-1">
                            Pembayaran dilakukan langsung saat serah terima kue.
                        </p>
                        <p className="mt-1">
                            Status:{' '}
                            {order.payment_status === 'paid'
                                ? 'Lunas'
                                : 'Menunggu pembayaran saat serah terima'}
                        </p>
                    </div>
                    <div className="mt-6 flex gap-3 print:hidden">
                        <Button onClick={() => window.print()}>
                            Cetak invoice
                        </Button>
                        <Link href="/">
                            <Button variant="outline">Kembali ke Home</Button>
                        </Link>
                    </div>
                </article>
            </main>
        </div>
    );
}
