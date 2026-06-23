import { Head } from '@inertiajs/react';
import { PublicNavbar } from '@/components/public/public-navbar';
export default function Order() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title="Order Kue" />
            <PublicNavbar />
            <main className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-3xl font-semibold">
                    Form order segera hadir
                </h1>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                    Pilih ukuran, rasa, dan tambahan untuk membuat pesanan kue.
                </p>
            </main>
        </div>
    );
}
