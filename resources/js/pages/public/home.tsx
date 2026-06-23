import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CakeSlice,
    HeartHandshake,
} from 'lucide-react';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';

const benefits = [
    {
        icon: CakeSlice,
        title: 'Dibuat sesuai pesanan',
        description:
            'Pilih ukuran, rasa, tulisan, dan tema untuk momen spesial.',
    },
    {
        icon: CalendarDays,
        title: 'Pickup terjadwal',
        description: 'Tentukan waktu pengambilan yang nyaman untuk Anda.',
    },
    {
        icon: HeartHandshake,
        title: 'Mudah dipantau',
        description: 'Cek status pesanan kapan saja melalui nomor order Anda.',
    },
];

export default function Home() {
    return (
        <>
            <Head title="Kue Bahagia" />
            <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <PublicNavbar />
                <main>
                    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/40">
                        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
                            <div>
                                <p className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                                    Kue ulang tahun sesuai ceritamu
                                </p>
                                <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                                    Rayakan momen manis dengan kue yang dibuat
                                    khusus untukmu.
                                </h1>
                                <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">
                                    Pesan kue ulang tahun tanpa ribet. Pilih
                                    detailnya, pilih pickup atau delivery/COD,
                                    lalu kami siapkan dengan sepenuh hati.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/order">
                                        <Button size="lg">
                                            Mulai pesan{' '}
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/cek-order">
                                        <Button size="lg" variant="outline">
                                            Cek pesanan
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 p-8 text-white">
                                    <CakeSlice className="size-12" />
                                    <p className="mt-12 text-sm font-medium text-blue-100">
                                        Pesan sesuai kebutuhan
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        Pilih ukuran, warna, tema, dan tambahan
                                        favoritmu.
                                    </p>
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                                    <div>
                                        <p className="font-semibold text-blue-600 dark:text-sky-400">
                                            20–30 cm
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Ukuran
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-600 dark:text-sky-400">
                                            Delivery & COD
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Terjadwal
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-600 dark:text-sky-400">
                                            Custom
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Tema
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                        <div className="max-w-xl">
                            <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
                                CARA PESAN
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold">
                                Sederhana dari awal sampai pesanan diterima.
                            </h2>
                        </div>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {benefits.map(
                                ({ icon: Icon, title, description }) => (
                                    <article
                                        key={title}
                                        className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-sky-950 dark:text-sky-400">
                                            <Icon className="size-5" />
                                        </span>
                                        <h3 className="mt-5 font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {description}
                                        </p>
                                    </article>
                                ),
                            )}
                        </div>
                    </section>
                </main>
                <footer className="border-t bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
                        <span>© {new Date().getFullYear()} Kue Bahagia</span>
                        <span>Pesan kue untuk momen yang lebih manis.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
