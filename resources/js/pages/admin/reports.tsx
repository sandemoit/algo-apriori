import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { ReportsPageContent } from '@/components/admin/reports-page-content';

export default function Reports(
    props: ComponentProps<typeof ReportsPageContent>,
) {
    return (
        <>
            <Head title="Laporan & Apriori" />
            <div className="p-4 md:p-6">
                <ReportsPageContent {...props} />
            </div>
        </>
    );
}
