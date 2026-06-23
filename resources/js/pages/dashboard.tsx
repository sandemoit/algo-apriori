import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { DashboardOperational } from '@/components/admin/dashboard-operational';

export default function Dashboard(
    props: ComponentProps<typeof DashboardOperational>,
) {
    return (
        <>
            <Head title="Dashboard" />
            <DashboardOperational {...props} />
        </>
    );
}
