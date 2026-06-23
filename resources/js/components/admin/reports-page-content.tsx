import { Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Clock3,
    Copy,
    Download,
    Eye,
    History,
    Info,
    Play,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AnalysisParameterCard } from '@/components/admin/reports/analysis-parameter-card';
import {
    formatDate,
    formatDateTime,
    formatLift,
    formatPercentage,
    itemNames,
    ruleItems,
} from '@/components/admin/reports/report-types';
import type {
    AnalysisRun,
    Insight,
    Itemset,
    Overview,
    Pagination,
    Rule,
} from '@/components/admin/reports/report-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Tab = 'summary' | 'itemsets' | 'rules' | 'history';

type Defaults = {
    minimum_support: number;
    minimum_confidence: number;
    minimum_lift: number;
    maximum_itemset: number;
    maximum_rules: number;
    minimum_occurrence: number;
};

type Props = {
    run: AnalysisRun | null;
    itemsets: Pagination<Itemset> | null;
    rules: Pagination<Rule> | null;
    history: Pagination<AnalysisRun>;
    overview: Overview | null;
    filters: Record<string, string | undefined>;
    defaults: Defaults;
};

const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'summary', label: 'Ringkasan' },
    { value: 'itemsets', label: 'Kombinasi Produk' },
    { value: 'rules', label: 'Aturan Asosiasi' },
    { value: 'history', label: 'Riwayat Analisis' },
];

export function ReportsPageContent({
    run,
    itemsets,
    rules,
    history,
    overview,
    filters,
    defaults,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('summary');

    return (
        <div className="space-y-6">
            <ReportPageHeader run={run} />
            <AnalysisParameterCard defaults={defaults} />

            {run === null ? (
                <ReportEmptyState />
            ) : (
                <>
                    <AnalysisStatusNotice run={run} />
                    <AnalysisSummaryCards run={run} />
                    <BusinessInsightCards insights={overview?.insights ?? []} />

                    <div className="flex flex-wrap gap-2 border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab(tab.value)}
                                className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
                                    activeTab === tab.value
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'summary' && (
                        <SalesOverviewCharts overview={overview} run={run} />
                    )}
                    {activeTab === 'itemsets' && (
                        <FrequentItemsetsTable
                            itemsets={itemsets}
                            filters={filters}
                            runId={run.id}
                        />
                    )}
                    {activeTab === 'rules' && (
                        <AssociationRulesTable
                            rules={rules}
                            filters={filters}
                            run={run}
                        />
                    )}
                    {activeTab === 'history' && (
                        <AnalysisHistoryTable history={history} />
                    )}
                </>
            )}
        </div>
    );
}

function ReportPageHeader({ run }: { run: AnalysisRun | null }) {
    const exportUrl = run
        ? `/admin/reports/export?run_id=${run.id}&type=rules`
        : '/admin/reports/export';

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Laporan Penjualan & Analisis Apriori
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    Analisis transaksi penjualan untuk menemukan produk yang
                    sering dibeli bersama dan peluang strategi penjualan.
                </p>
                <p className="text-xs text-muted-foreground">
                    Terakhir dianalisis:{' '}
                    <span className="font-medium text-foreground">
                        {run
                            ? formatDateTime(
                                  run.completed_at ?? run.executed_at,
                              )
                            : 'Belum ada'}
                    </span>
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button type="submit" form="run-apriori-analysis">
                    <Play className="size-4" />
                    Jalankan Analisis
                </Button>
                <Button asChild variant="outline" disabled={!run}>
                    <a href={exportUrl}>
                        <Download className="size-4" />
                        Ekspor Laporan
                    </a>
                </Button>
            </div>
        </div>
    );
}

function AnalysisStatusNotice({ run }: { run: AnalysisRun }) {
    if (run.status === 'completed') {
        return null;
    }

    const message =
        run.status === 'failed'
            ? (run.error_message ?? 'Analisis gagal diselesaikan.')
            : 'Analisis sedang diproses. Hasil lama tidak dihapus sampai proses selesai.';

    return (
        <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Info className="mt-0.5 size-4" />
                <span>{message}</span>
            </CardContent>
        </Card>
    );
}

function AnalysisSummaryCards({ run }: { run: AnalysisRun }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
                label="Total Transaksi Dianalisis"
                value={run.transaction_count.toLocaleString('id-ID')}
                icon={<BarChart3 className="size-4" />}
            />
            <SummaryCard
                label="Produk Unik"
                value={run.unique_item_count.toLocaleString('id-ID')}
                icon={<Info className="size-4" />}
            />
            <SummaryCard
                label="Frequent Itemsets"
                value={run.frequent_itemset_count.toLocaleString('id-ID')}
                icon={<BarChart3 className="size-4" />}
            />
            <SummaryCard
                label="Aturan Asosiasi"
                value={run.rule_count.toLocaleString('id-ID')}
                icon={<History className="size-4" />}
            />
            <SummaryCard
                label="Durasi Analisis"
                value={
                    run.execution_time_ms === null
                        ? '-'
                        : `${(run.execution_time_ms / 1000).toLocaleString(
                              'id-ID',
                              {
                                  maximumFractionDigits: 2,
                              },
                          )} detik`
                }
                icon={<Clock3 className="size-4" />}
            />
        </section>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: ReactNode;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium tracking-wide uppercase">
                        {label}
                    </span>
                    {icon}
                </div>
                <div className="mt-3 text-2xl font-semibold">{value}</div>
            </CardContent>
        </Card>
    );
}

function BusinessInsightCards({ insights }: { insights: Insight[] }) {
    if (insights.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    Belum ada insight yang memenuhi parameter analisis. Coba
                    gunakan periode lebih panjang atau turunkan minimum support
                    dan confidence.
                </CardContent>
            </Card>
        );
    }

    return (
        <section className="grid gap-4 lg:grid-cols-3">
            {insights.slice(0, 5).map((insight) => (
                <Card key={insight.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {insight.antecedent} → {insight.consequent}
                        </CardTitle>
                        <CardDescription>
                            Potensi cross-selling berdasarkan transaksi selesai.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                            <Metric
                                label="Support"
                                value={formatPercentage(insight.support)}
                            />
                            <Metric
                                label="Confidence"
                                value={formatPercentage(insight.confidence)}
                            />
                            <Metric
                                label="Lift"
                                value={formatLift(insight.lift)}
                            />
                        </div>
                        <p className="text-muted-foreground">
                            {insight.interpretation}
                        </p>
                        <p className="rounded-lg bg-blue-50 p-3 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
                            {insight.recommendation}
                        </p>
                        {insight.limited_data && (
                            <Badge variant="outline">
                                Data kemunculan masih terbatas
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}

function SalesOverviewCharts({
    overview,
    run,
}: {
    overview: Overview | null;
    run: AnalysisRun;
}) {
    if (overview === null) {
        return <ReportEmptyState />;
    }

    return (
        <div className="grid gap-6 xl:grid-cols-2">
            <HorizontalBarChart
                title="Produk Terlaris"
                description="Berdasarkan jumlah order selesai yang mengandung produk tersebut."
                rows={overview.topProducts.map((itemset) => ({
                    label: itemNames(itemset.items),
                    value: itemset.support_count,
                    suffix: `${formatPercentage(itemset.support)} dari transaksi`,
                }))}
            />
            <HorizontalBarChart
                title="Kombinasi Produk Teratas"
                description="Kombinasi dengan support tertinggi pada periode analisis."
                rows={overview.topCombinations.map((itemset) => ({
                    label: itemNames(itemset.items),
                    value: itemset.support_count,
                    suffix: formatPercentage(itemset.support),
                }))}
            />
            <RuleScatterChart rules={overview.rules} />
            <Card>
                <CardHeader>
                    <CardTitle>Cara Membaca Hasil</CardTitle>
                    <CardDescription>
                        Parameter periode: {formatDate(run.date_from)} –{' '}
                        {formatDate(run.date_to)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        Support menunjukkan seberapa sering kombinasi muncul
                        dalam seluruh transaksi yang dianalisis.
                    </p>
                    <p>
                        Confidence menunjukkan kemungkinan produk tujuan ikut
                        dibeli pada transaksi yang berisi produk awal.
                    </p>
                    <p>
                        Lift menunjukkan kekuatan asosiasi dibandingkan pola
                        pembelian normal. Lift di atas 1 berarti asosiasi
                        positif.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function HorizontalBarChart({
    title,
    description,
    rows,
}: {
    title: string;
    description: string;
    rows: Array<{ label: string; value: number; suffix: string }>;
}) {
    const max = Math.max(...rows.map((row) => row.value), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Tidak ada data untuk divisualisasikan.
                    </p>
                ) : (
                    rows.map((row) => (
                        <div key={row.label} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="truncate font-medium">
                                    {row.label}
                                </span>
                                <span className="text-muted-foreground">
                                    {row.value.toLocaleString('id-ID')} ·{' '}
                                    {row.suffix}
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                                <div
                                    className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                                    style={{
                                        width: `${(row.value / max) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function RuleScatterChart({ rules }: { rules: Rule[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Aturan</CardTitle>
                <CardDescription>
                    Sumbu X = support, sumbu Y = confidence, ukuran titik =
                    lift.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative h-72 rounded-xl border bg-muted/20 p-4">
                    {rules.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Tidak ada aturan untuk divisualisasikan.
                        </div>
                    ) : (
                        rules.slice(0, 30).map((rule) => {
                            const support = Number(rule.support);
                            const confidence = Number(rule.confidence);
                            const lift = Number(rule.lift);
                            const size = Math.min(
                                28,
                                Math.max(10, 8 + lift * 4),
                            );

                            return (
                                <span
                                    key={rule.id}
                                    title={`${ruleItems(rule, 'antecedent').join(', ')} → ${ruleItems(rule, 'consequent').join(', ')} | support ${formatPercentage(support)}, confidence ${formatPercentage(confidence)}, lift ${formatLift(lift)}`}
                                    className="absolute rounded-full bg-blue-600/75 ring-2 ring-white dark:bg-blue-400/80 dark:ring-background"
                                    style={{
                                        left: `${Math.min(support * 100, 95)}%`,
                                        bottom: `${Math.min(confidence * 100, 95)}%`,
                                        height: size,
                                        width: size,
                                    }}
                                />
                            );
                        })
                    )}
                    <span className="absolute bottom-2 left-3 text-xs text-muted-foreground">
                        Support
                    </span>
                    <span className="absolute top-3 left-3 text-xs text-muted-foreground">
                        Confidence
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function FrequentItemsetsTable({
    itemsets,
    filters,
    runId,
}: {
    itemsets: Pagination<Itemset> | null;
    filters: Record<string, string | undefined>;
    runId: number;
}) {
    const [search, setSearch] = useState(filters.itemset_search ?? '');
    const [size, setSize] = useState(filters.itemset_size ?? 'all');
    const [minimumSupport, setMinimumSupport] = useState(
        filters.itemset_min_support ?? '',
    );
    const [selected, setSelected] = useState<Itemset | null>(null);

    function apply(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        router.get(
            '/admin/reports',
            {
                ...filters,
                run_id: runId,
                itemset_search: search || undefined,
                itemset_size: size === 'all' ? undefined : size,
                itemset_min_support: minimumSupport || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kombinasi Produk</CardTitle>
                <CardDescription>
                    Frequent itemsets yang memenuhi support dan minimum
                    kemunculan transaksi.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-2"
                >
                    <FilterSearch
                        value={search}
                        onChange={setSearch}
                        placeholder="Cari nama produk"
                    />
                    <div className="w-full sm:w-40">
                        <Label className="mb-2 block text-xs">
                            Jumlah item
                        </Label>
                        <Select value={size} onValueChange={setSize}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="1">1 item</SelectItem>
                                <SelectItem value="2">2 item</SelectItem>
                                <SelectItem value="3">3 item</SelectItem>
                                <SelectItem value="4">4 item</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-44">
                        <Label className="mb-2 block text-xs">
                            Min support (%)
                        </Label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={minimumSupport}
                            onChange={(event) =>
                                setMinimumSupport(event.target.value)
                            }
                        />
                    </div>
                    <Button type="submit">Terapkan</Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                            router.get('/admin/reports', { run_id: runId })
                        }
                    >
                        Reset
                    </Button>
                    <Button asChild variant="outline">
                        <a
                            href={`/admin/reports/export?run_id=${runId}&type=itemsets`}
                        >
                            <Download className="size-4" />
                            Ekspor CSV
                        </a>
                    </Button>
                </form>

                <ResponsiveTable
                    empty={!itemsets || itemsets.data.length === 0}
                    emptyText="Tidak ada kombinasi produk yang memenuhi filter."
                >
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="p-4">No</th>
                            <th className="p-4">Kombinasi Produk</th>
                            <th className="p-4">Jumlah Produk</th>
                            <th className="p-4">Jumlah Transaksi</th>
                            <th className="p-4">Support</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsets?.data.map((itemset, index) => (
                            <tr
                                key={itemset.id}
                                className="border-t hover:bg-muted/30"
                            >
                                <td className="p-4">{index + 1}</td>
                                <td className="p-4 font-medium">
                                    {itemNames(itemset.items)}
                                </td>
                                <td className="p-4">{itemset.item_count}</td>
                                <td className="p-4">{itemset.support_count}</td>
                                <td className="p-4">
                                    {formatPercentage(itemset.support)}
                                </td>
                                <td className="p-4 text-right">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelected(itemset)}
                                    >
                                        <Eye className="size-4" />
                                        Detail
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </ResponsiveTable>

                <PaginationLinks links={itemsets?.links ?? []} />
            </CardContent>

            <Dialog
                open={selected !== null}
                onOpenChange={() => setSelected(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail Kombinasi Produk</DialogTitle>
                        <DialogDescription>
                            Tidak menampilkan data pribadi pelanggan.
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="flex flex-wrap gap-2">
                                {selected.items.map((item) => (
                                    <Badge key={item.id} variant="secondary">
                                        {item.additional_item.name}
                                    </Badge>
                                ))}
                            </div>
                            <MetricGrid
                                metrics={[
                                    [
                                        'Jumlah transaksi',
                                        selected.support_count,
                                    ],
                                    [
                                        'Support',
                                        formatPercentage(selected.support),
                                    ],
                                    ['Jumlah produk', selected.item_count],
                                ]}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function AssociationRulesTable({
    rules,
    filters,
    run,
}: {
    rules: Pagination<Rule> | null;
    filters: Record<string, string | undefined>;
    run: AnalysisRun;
}) {
    const [search, setSearch] = useState(filters.rule_search ?? '');
    const [minimumSupport, setMinimumSupport] = useState(
        filters.rule_min_support ?? '',
    );
    const [minimumConfidence, setMinimumConfidence] = useState(
        filters.rule_min_confidence ?? '',
    );
    const [minimumLift, setMinimumLift] = useState(filters.rule_min_lift ?? '');
    const [sort, setSort] = useState(filters.rule_sort ?? run.sort_by);
    const [selected, setSelected] = useState<Rule | null>(null);

    function apply(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        router.get(
            '/admin/reports',
            {
                ...filters,
                run_id: run.id,
                rule_search: search || undefined,
                rule_min_support: minimumSupport || undefined,
                rule_min_confidence: minimumConfidence || undefined,
                rule_min_lift: minimumLift || undefined,
                rule_sort: sort,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aturan Asosiasi</CardTitle>
                <CardDescription>
                    Rule dibaca sebagai indikasi pola pembelian, bukan hubungan
                    sebab-akibat.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-2"
                >
                    <FilterSearch
                        value={search}
                        onChange={setSearch}
                        placeholder="Cari antecedent/consequent"
                    />
                    <MetricFilter
                        label="Min support (%)"
                        value={minimumSupport}
                        onChange={setMinimumSupport}
                    />
                    <MetricFilter
                        label="Min confidence (%)"
                        value={minimumConfidence}
                        onChange={setMinimumConfidence}
                    />
                    <MetricFilter
                        label="Min lift"
                        value={minimumLift}
                        onChange={setMinimumLift}
                    />
                    <div className="w-full sm:w-44">
                        <Label className="mb-2 block text-xs">Urutkan</Label>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="confidence">
                                    Confidence
                                </SelectItem>
                                <SelectItem value="lift">Lift</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit">Terapkan</Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                            router.get('/admin/reports', { run_id: run.id })
                        }
                    >
                        Reset
                    </Button>
                    <Button asChild variant="outline">
                        <a
                            href={`/admin/reports/export?run_id=${run.id}&type=rules`}
                        >
                            <Download className="size-4" />
                            Ekspor CSV
                        </a>
                    </Button>
                </form>

                <ResponsiveTable
                    empty={!rules || rules.data.length === 0}
                    emptyText="Tidak ada aturan yang memenuhi parameter."
                >
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="p-4">No</th>
                            <th className="p-4">Jika Membeli</th>
                            <th className="p-4">Cenderung Membeli</th>
                            <th className="p-4">Support</th>
                            <th className="p-4">Confidence</th>
                            <th className="p-4">Lift</th>
                            <th className="p-4">Jumlah Transaksi</th>
                            <th className="p-4">Interpretasi</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules?.data.map((rule, index) => (
                            <tr
                                key={rule.id}
                                className="border-t hover:bg-muted/30"
                            >
                                <td className="p-4">{index + 1}</td>
                                <td className="p-4">
                                    <ProductBadges
                                        names={ruleItems(rule, 'antecedent')}
                                    />
                                </td>
                                <td className="p-4">
                                    <ProductBadges
                                        names={ruleItems(rule, 'consequent')}
                                    />
                                </td>
                                <td className="p-4">
                                    {formatPercentage(rule.support)}
                                </td>
                                <td className="p-4">
                                    {formatPercentage(rule.confidence)}
                                </td>
                                <td className="p-4">{formatLift(rule.lift)}</td>
                                <td className="p-4">{rule.support_count}</td>
                                <td className="max-w-md p-4 text-muted-foreground">
                                    {buildInterpretation(rule)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyRule(rule)}
                                        >
                                            <Copy className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setSelected(rule)}
                                        >
                                            Detail
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </ResponsiveTable>

                <PaginationLinks links={rules?.links ?? []} />
            </CardContent>

            <RuleDetailDialog
                rule={selected}
                run={run}
                onClose={() => setSelected(null)}
            />
        </Card>
    );
}

function RuleDetailDialog({
    rule,
    run,
    onClose,
}: {
    rule: Rule | null;
    run: AnalysisRun;
    onClose: () => void;
}) {
    const recommendation = useMemo(() => {
        if (rule === null) {
            return '';
        }

        return `Pertimbangkan paket bundling atau rekomendasi ${ruleItems(rule, 'consequent').join(', ')} saat pelanggan memilih ${ruleItems(rule, 'antecedent').join(', ')}.`;
    }, [rule]);

    return (
        <Dialog open={rule !== null} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detail Aturan Asosiasi</DialogTitle>
                    <DialogDescription>
                        Parameter: support{' '}
                        {formatPercentage(run.minimum_support)}, confidence{' '}
                        {formatPercentage(run.minimum_confidence)}, lift{' '}
                        {formatLift(run.minimum_lift)}.
                    </DialogDescription>
                </DialogHeader>
                {rule && (
                    <div className="space-y-5 text-sm">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="mb-2 font-medium">Jika membeli</p>
                                <ProductBadges
                                    names={ruleItems(rule, 'antecedent')}
                                />
                            </div>
                            <div>
                                <p className="mb-2 font-medium">
                                    Cenderung membeli
                                </p>
                                <ProductBadges
                                    names={ruleItems(rule, 'consequent')}
                                />
                            </div>
                        </div>
                        <MetricGrid
                            metrics={[
                                ['Support', formatPercentage(rule.support)],
                                [
                                    'Confidence',
                                    formatPercentage(rule.confidence),
                                ],
                                ['Lift', formatLift(rule.lift)],
                                ['Jumlah transaksi', rule.support_count],
                                ['Total transaksi', run.transaction_count],
                                [
                                    'Periode',
                                    `${formatDate(run.date_from)} – ${formatDate(run.date_to)}`,
                                ],
                            ]}
                        />
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="font-medium">Interpretasi</p>
                            <p className="mt-2 text-muted-foreground">
                                {buildInterpretation(rule)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
                            <p className="font-medium">Rekomendasi praktis</p>
                            <p className="mt-2">{recommendation}</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AnalysisHistoryTable({
    history,
}: {
    history: Pagination<AnalysisRun>;
}) {
    const [deleting, setDeleting] = useState<AnalysisRun | null>(null);

    function rerun(run: AnalysisRun): void {
        router.post(
            `/admin/apriori/${run.id}/rerun`,
            {},
            { preserveScroll: true },
        );
    }

    function destroy(): void {
        if (deleting === null) {
            return;
        }

        router.delete(`/admin/apriori/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Analisis</CardTitle>
                <CardDescription>
                    Snapshot hasil disimpan agar laporan lama tidak berubah saat
                    data order berubah.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ResponsiveTable
                    empty={history.data.length === 0}
                    emptyText="Belum ada riwayat analisis."
                >
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="p-4">Waktu Analisis</th>
                            <th className="p-4">Periode</th>
                            <th className="p-4">Dijalankan Oleh</th>
                            <th className="p-4">Support</th>
                            <th className="p-4">Confidence</th>
                            <th className="p-4">Lift</th>
                            <th className="p-4">Transaksi</th>
                            <th className="p-4">Itemset</th>
                            <th className="p-4">Rule</th>
                            <th className="p-4">Durasi</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.data.map((run) => (
                            <tr
                                key={run.id}
                                className="border-t hover:bg-muted/30"
                            >
                                <td className="p-4">
                                    {formatDateTime(
                                        run.completed_at ?? run.executed_at,
                                    )}
                                </td>
                                <td className="p-4">
                                    {formatDate(run.date_from)} –{' '}
                                    {formatDate(run.date_to)}
                                </td>
                                <td className="p-4">
                                    {run.executed_by?.name ?? '-'}
                                </td>
                                <td className="p-4">
                                    {formatPercentage(run.minimum_support)}
                                </td>
                                <td className="p-4">
                                    {formatPercentage(run.minimum_confidence)}
                                </td>
                                <td className="p-4">
                                    {formatLift(run.minimum_lift)}
                                </td>
                                <td className="p-4">{run.transaction_count}</td>
                                <td className="p-4">
                                    {run.frequent_itemset_count}
                                </td>
                                <td className="p-4">{run.rule_count}</td>
                                <td className="p-4">
                                    {run.execution_time_ms === null
                                        ? '-'
                                        : `${(
                                              run.execution_time_ms / 1000
                                          ).toLocaleString('id-ID', {
                                              maximumFractionDigits: 2,
                                          })} dtk`}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={run.status} />
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={`/admin/reports?run_id=${run.id}`}
                                            >
                                                Lihat
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => rerun(run)}
                                        >
                                            <RotateCcw className="size-4" />
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <a
                                                href={`/admin/reports/export?run_id=${run.id}&type=rules`}
                                            >
                                                <Download className="size-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDeleting(run)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </ResponsiveTable>
                <PaginationLinks links={history.links} />
            </CardContent>

            <Dialog
                open={deleting !== null}
                onOpenChange={() => setDeleting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus riwayat analisis?</DialogTitle>
                        <DialogDescription>
                            Hasil itemset dan aturan untuk analisis ini akan
                            ikut dihapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={destroy}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function ReportEmptyState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="rounded-full bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    <BarChart3 className="size-6" />
                </div>
                <div>
                    <h2 className="font-semibold">
                        Belum ada analisis untuk periode ini
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        Pilih periode transaksi dan parameter analisis untuk
                        menemukan pola produk yang sering dibeli bersama.
                    </p>
                </div>
                <Button type="submit" form="run-apriori-analysis">
                    Mulai Analisis
                </Button>
            </CardContent>
        </Card>
    );
}

function ResponsiveTable({
    children,
    empty,
    emptyText,
}: {
    children: ReactNode;
    empty: boolean;
    emptyText: string;
}) {
    return (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[1050px] text-sm">
                {children}
                {empty && (
                    <tbody>
                        <tr>
                            <td
                                className="p-12 text-center text-muted-foreground"
                                colSpan={12}
                            >
                                {emptyText}
                            </td>
                        </tr>
                    </tbody>
                )}
            </table>
        </div>
    );
}

function PaginationLinks({
    links,
}: {
    links: Array<{ url: string | null; label: string; active: boolean }>;
}) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap justify-end gap-1">
            {links.map((link, index) => (
                <Button
                    key={`${link.label}-${index}`}
                    size="sm"
                    variant={link.active ? 'default' : 'outline'}
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function MetricGrid({
    metrics,
}: {
    metrics: Array<[string, string | number]>;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map(([label, value]) => (
                <Metric key={label} label={label} value={String(value)} />
            ))}
        </div>
    );
}

function ProductBadges({ names }: { names: string[] }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {names.map((name) => (
                <Badge key={name} variant="secondary">
                    {name}
                </Badge>
            ))}
        </div>
    );
}

function FilterSearch({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="w-full sm:w-72">
            <Label className="mb-2 block text-xs">Search</Label>
            <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="pl-9"
                />
            </div>
        </div>
    );
}

function MetricFilter({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="w-full sm:w-40">
            <Label className="mb-2 block text-xs">{label}</Label>
            <Input
                type="number"
                min={0}
                step={0.01}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: AnalysisRun['status'] }) {
    const labels: Record<AnalysisRun['status'], string> = {
        pending: 'Menunggu',
        processing: 'Diproses',
        completed: 'Selesai',
        failed: 'Gagal',
    };

    const variant: 'default' | 'destructive' | 'outline' =
        status === 'failed'
            ? 'destructive'
            : status === 'completed'
              ? 'default'
              : 'outline';

    return <Badge variant={variant}>{labels[status]}</Badge>;
}

function buildInterpretation(rule: Rule): string {
    const antecedent = ruleItems(rule, 'antecedent').join(', ');
    const consequent = ruleItems(rule, 'consequent').join(', ');

    return `Dari transaksi yang membeli ${antecedent}, ${formatPercentage(rule.confidence)} juga membeli ${consequent}. Kombinasi ini muncul ${formatLift(rule.lift)} kali dibandingkan kemungkinan normal.`;
}

function copyRule(rule: Rule): void {
    const text = `${ruleItems(rule, 'antecedent').join(', ')} → ${ruleItems(rule, 'consequent').join(', ')} | Support ${formatPercentage(rule.support)} | Confidence ${formatPercentage(rule.confidence)} | Lift ${formatLift(rule.lift)}`;

    if (navigator.clipboard) {
        void navigator.clipboard.writeText(text);
    }
}
