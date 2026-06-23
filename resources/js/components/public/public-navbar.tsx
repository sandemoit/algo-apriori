import { Link } from '@inertiajs/react';
import { CakeSlice, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const links = [
    { label: 'Home', href: '/' },
    { label: 'Order', href: '/order' },
    { label: 'Cek Order', href: '/cek-order' },
];

export function PublicNavbar() {
    return (
        <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
                >
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white">
                        <CakeSlice className="size-5" />
                    </span>
                    Kue Bahagia
                </Link>
                <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="transition hover:text-blue-600 dark:hover:text-sky-400"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <Link href="/order" className="hidden md:block">
                    <Button>Pesan sekarang</Button>
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
                                    className="rounded-lg px-3 py-3 font-medium hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
