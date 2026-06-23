import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckOrderForm() {
    const form = useForm({ order_number: '', phone: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/cek-order');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title="Cek Order" />
            <PublicNavbar />
            <main className="mx-auto max-w-md px-4 py-20">
                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h1 className="text-2xl font-semibold">Cek pesanan</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Masukkan nomor order dan nomor WhatsApp yang dipakai
                        saat memesan.
                    </p>
                    <form onSubmit={submit} className="mt-6 grid gap-4">
                        <label className="grid gap-2 text-sm font-medium">
                            Nomor order
                            <Input
                                placeholder="ORD-202606-0001"
                                value={form.data.order_number}
                                onChange={(e) =>
                                    form.setData('order_number', e.target.value)
                                }
                            />
                            {form.errors.order_number && (
                                <span className="text-xs text-red-600">
                                    {form.errors.order_number}
                                </span>
                            )}
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                            Nomor WhatsApp
                            <Input
                                placeholder="0812..."
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                            {form.errors.phone && (
                                <span className="text-xs text-red-600">
                                    {form.errors.phone}
                                </span>
                            )}
                        </label>
                        <Button disabled={form.processing}>
                            {form.processing ? 'Memeriksa...' : 'Cek order'}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
