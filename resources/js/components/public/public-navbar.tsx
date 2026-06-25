import { Link, usePage } from '@inertiajs/react';
import { CakeSlice, Gift, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const links = [
    { label: 'Home', href: '/' },
    { label: 'Order', href: '/order' },
    { label: 'Cek Order', href: '/cek-order' },
];

export function PublicNavbar() {
    const { store } = usePage().props;

    return (
        <header className="sticky top-0 z-40 border-b border-rose-100/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
                >
                    <span className="grid size-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-200/70 dark:shadow-none">
                        {store.logo_url ? (
                            <img
                                alt={`Logo ${store.name}`}
                                className="size-full object-cover"
                                src={store.logo_url}
                            />
                        ) : (
                            <CakeSlice className="size-5" />
                        )}
                    </span>
                    {store.name}
                </Link>
                <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="transition hover:text-rose-600 dark:hover:text-rose-300"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <Link href="/order" className="hidden md:block">
                    <Button className="bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400">
                        <Gift className="size-4" />
                        Pesan sekarang
                    </Button>
                </Link>
                <Sheet>
                    <SheetTrigger asChild className="md:hidden">
                        <Button size="icon" variant="ghost">
                            <Menu className="size-5" />
                            <span className="sr-only">Buka menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                        <div className="mt-10 grid gap-2">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-lg px-3 py-3 font-medium hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-slate-800 dark:hover:text-rose-300"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link href="/order" className="mt-2">
                                <Button className="w-full bg-rose-600 text-white hover:bg-rose-700">
                                    Pesan sekarang
                                </Button>
                            </Link>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
