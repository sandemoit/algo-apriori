import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Gift,
    HeartHandshake,
    PartyPopper,
    Sparkles,
} from 'lucide-react';
import { PublicNavbar } from '@/components/public/public-navbar';
import { Button } from '@/components/ui/button';

const benefits = [
    {
        icon: PartyPopper,
        title: 'Tema ulang tahun',
        description:
            'Pilih tulisan, warna, karakter, dan tambahan untuk pestamu.',
    },
    {
        icon: CalendarDays,
        title: 'Pickup atau delivery',
        description: 'Atur jadwal terima kue sesuai acara dan kebutuhan.',
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
            <div className="min-h-screen bg-[#fff8f2] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <PublicNavbar />
                <main>
                    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(251,113,133,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.18),transparent_24%),linear-gradient(135deg,#fff7ed,#fff,#fdf2f8)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(135deg,#0f172a,#111827,#1e1b4b)]">
                        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_center,rgba(244,63,94,0.2)_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-60 dark:opacity-20" />
                        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
                            <div className="relative">
                                <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100 dark:bg-slate-900/80 dark:text-rose-200 dark:ring-slate-700">
                                    <Sparkles className="size-4" />
                                    Kue ulang tahun sesuai ceritamu
                                </p>
                                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
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
                                        <Button
                                            className="h-12 rounded-full bg-rose-600 px-7 text-base text-white shadow-xl shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-700 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400"
                                            size="lg"
                                        >
                                            Pesan kue sekarang
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/cek-order">
                                        <Button
                                            className="h-12 rounded-full border-rose-200 bg-white/80 px-7 text-base text-rose-700 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-rose-200 dark:hover:bg-slate-800"
                                            size="lg"
                                            variant="outline"
                                        >
                                            Cek pesanan
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -top-6 -left-6 grid size-16 rotate-[-10deg] place-items-center rounded-3xl bg-yellow-300 text-yellow-900 shadow-lg">
                                    <Gift className="size-8" />
                                </div>
                                <div className="absolute -right-4 -bottom-5 hidden size-24 rounded-full bg-sky-200/80 blur-2xl sm:block dark:bg-sky-500/20" />
                                <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-2xl shadow-rose-100 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
                                    <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-100 via-orange-50 to-sky-100 p-8 dark:from-rose-950/60 dark:via-slate-900 dark:to-sky-950/50">
                                        <div className="mx-auto flex max-w-xs flex-col items-center">
                                            <div className="mb-1 flex gap-4">
                                                <span className="h-12 w-2 rounded-full bg-sky-400" />
                                                <span className="h-14 w-2 rounded-full bg-rose-500" />
                                                <span className="h-12 w-2 rounded-full bg-yellow-400" />
                                            </div>
                                            <div className="h-4 w-36 rounded-t-full bg-rose-400 shadow-sm" />
                                            <div className="h-20 w-64 rounded-t-[2rem] bg-gradient-to-b from-pink-200 to-rose-300 p-4 shadow-xl">
                                                <div className="flex justify-center gap-3">
                                                    <span className="size-3 rounded-full bg-white" />
                                                    <span className="size-3 rounded-full bg-white" />
                                                    <span className="size-3 rounded-full bg-white" />
                                                </div>
                                                <p className="mt-4 text-center text-sm font-bold text-rose-900">
                                                    Happy Birthday
                                                </p>
                                            </div>
                                            <div className="h-14 w-72 rounded-b-[2rem] bg-gradient-to-b from-orange-200 to-orange-300 shadow-2xl">
                                                <div className="mx-auto h-3 w-56 rounded-b-full bg-white/70" />
                                            </div>
                                            <div className="h-4 w-80 rounded-full bg-slate-200 dark:bg-slate-700" />
                                        </div>
                                        <div className="mt-8 rounded-2xl bg-white/75 p-4 text-center shadow-sm dark:bg-slate-950/50">
                                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                                                Pesan sesuai kebutuhan
                                            </p>
                                            <p className="mt-1 text-xl font-bold">
                                                Ukuran, warna, tema, lilin, dan
                                                tambahan favorit.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                                        <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/30">
                                            <p className="font-semibold text-rose-600 dark:text-rose-300">
                                                20–30 cm
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Ukuran
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-orange-50 p-3 dark:bg-orange-950/30">
                                            <p className="font-semibold text-orange-600 dark:text-orange-300">
                                                COD
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Delivery
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/30">
                                            <p className="font-semibold text-sky-600 dark:text-sky-300">
                                                Custom
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Tema
                                            </p>
                                        </div>
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
                                        <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
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
