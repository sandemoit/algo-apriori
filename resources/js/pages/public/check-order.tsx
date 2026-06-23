import { Head } from '@inertiajs/react';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function CheckOrder() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title="Cek Order" />
            <PublicNavbar />
            <main className="mx-auto max-w-md px-4 py-20">
                <h1 className="text-3xl font-semibold">Cek pesanan</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Masukkan nomor order atau tautan invoice Anda.
                </p>
                <div className="mt-6 grid gap-3">
                    <Input placeholder="Contoh: ORD-202606-0001" />
                    <Button>Cek order</Button>
                </div>
            </main>
        </div>
    );
}
