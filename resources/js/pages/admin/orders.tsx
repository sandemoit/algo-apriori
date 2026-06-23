import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { OrdersPageContent } from '@/components/admin/orders-page-content';
import { PageHeader } from '@/components/page-header';

export default function Orders(
    props: ComponentProps<typeof OrdersPageContent>,
) {
    return (
        <>
            <Head title="Daftar Order" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Daftar Order"
                    description="Kelola pesanan pelanggan, jadwal penerimaan, dan pembayaran."
                />
                <OrdersPageContent {...props} />
            </div>
        </>
    );
}
