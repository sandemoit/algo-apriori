import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { SettingsPageContent } from '@/components/admin/settings-page-content';
import { PageHeader } from '@/components/page-header';

export default function Settings(
    props: ComponentProps<typeof SettingsPageContent>,
) {
    return (
        <>
            {' '}
            <Head title="Pengaturan" />
            <div className="p-4 md:p-6">
                <PageHeader
                    title="Pengaturan"
                    description="Profil toko, master data, dan template WhatsApp."
                />
                <div className="mt-6">
                    <SettingsPageContent {...props} />
                </div>
            </div>
        </>
    );
}
