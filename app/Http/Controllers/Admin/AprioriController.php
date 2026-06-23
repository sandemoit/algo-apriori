<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\AprioriAnalysisStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\RunAprioriRequest;
use App\Jobs\RunAprioriAnalysisJob;
use App\Models\AprioriAnalysisRun;
use App\Models\AprioriItemset;
use App\Models\AprioriRule;
use App\Services\AprioriService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFactory;
use Inertia\Inertia;
use Inertia\Response;

class AprioriController extends Controller
{
    public function index(Request $request): Response
    {
        $run = $this->selectedRun($request);

        return Inertia::render('admin/reports', [
            'run' => $run,
            'itemsets' => $run === null ? null : $this->itemsets($request, $run),
            'rules' => $run === null ? null : $this->rules($request, $run),
            'history' => AprioriAnalysisRun::query()
                ->with('executedBy:id,name')
                ->latest('executed_at')
                ->paginate(10, ['*'], 'history_page')
                ->withQueryString(),
            'overview' => $run === null ? null : $this->overview($run),
            'filters' => $request->only([
                'run_id',
                'itemset_search',
                'itemset_size',
                'itemset_min_support',
                'rule_search',
                'rule_min_support',
                'rule_min_confidence',
                'rule_min_lift',
                'rule_sort',
            ]),
            'defaults' => [
                'minimum_support' => config('apriori.default_minimum_support') * 100,
                'minimum_confidence' => config('apriori.default_minimum_confidence') * 100,
                'minimum_lift' => config('apriori.default_minimum_lift'),
                'maximum_itemset' => config('apriori.default_maximum_itemset'),
                'maximum_rules' => config('apriori.default_maximum_rules'),
                'minimum_occurrence' => config('apriori.default_minimum_occurrence'),
            ],
        ]);
    }

    public function store(RunAprioriRequest $request, AprioriService $service): RedirectResponse
    {
        $run = $service->createRun((int) $request->user()->id, $request->analysisParameters());

        if ($service->shouldQueue($run)) {
            RunAprioriAnalysisJob::dispatch($run->id);

            return to_route('admin.reports', ['run_id' => $run->id])
                ->with('success', 'Analisis sedang diproses. Muat ulang halaman ini untuk melihat hasil terbaru.');
        }

        $run = $service->execute($run);
        if ($run->status === AprioriAnalysisStatus::Failed) {
            return to_route('admin.reports', ['run_id' => $run->id])
                ->with('error', 'Analisis gagal diselesaikan. Silakan coba lagi.');
        }

        return to_route('admin.reports', ['run_id' => $run->id])
            ->with('success', $run->transaction_count === 0
                ? 'Tidak ada transaksi selesai pada periode yang dipilih.'
                : 'Analisis Apriori selesai dijalankan.');
    }

    public function show(AprioriAnalysisRun $aprioriAnalysisRun): RedirectResponse
    {
        return to_route('admin.reports', ['run_id' => $aprioriAnalysisRun->id]);
    }

    public function rerun(AprioriAnalysisRun $aprioriAnalysisRun, Request $request, AprioriService $service): RedirectResponse
    {
        $run = $service->createRun((int) $request->user()->id, [
            'date_from' => $aprioriAnalysisRun->date_from->toDateString(),
            'date_to' => $aprioriAnalysisRun->date_to->toDateString(),
            'minimum_support' => (float) $aprioriAnalysisRun->minimum_support,
            'minimum_confidence' => (float) $aprioriAnalysisRun->minimum_confidence,
            'minimum_lift' => (float) $aprioriAnalysisRun->minimum_lift,
            'maximum_itemset' => $aprioriAnalysisRun->maximum_itemset,
            'maximum_rules' => $aprioriAnalysisRun->maximum_rules,
            'minimum_occurrence' => $aprioriAnalysisRun->minimum_occurrence,
            'sort_by' => $aprioriAnalysisRun->sort_by,
        ]);

        if ($service->shouldQueue($run)) {
            RunAprioriAnalysisJob::dispatch($run->id);

            return to_route('admin.reports', ['run_id' => $run->id])
                ->with('success', 'Analisis ulang sedang diproses.');
        }

        $service->execute($run);

        return to_route('admin.reports', ['run_id' => $run->id])->with('success', 'Analisis ulang selesai dijalankan.');
    }

    public function destroy(AprioriAnalysisRun $aprioriAnalysisRun): RedirectResponse
    {
        $aprioriAnalysisRun->delete();

        return to_route('admin.reports')->with('success', 'Riwayat analisis dihapus.');
    }

    public function export(Request $request)
    {
        $run = AprioriAnalysisRun::query()->findOrFail($request->integer('run_id'));
        $type = $request->string('type', 'rules')->toString();
        $filename = sprintf('laporan-apriori-%s-sampai-%s-%s.csv', $run->date_from->format('Y-m-d'), $run->date_to->format('Y-m-d'), $type);

        return ResponseFactory::streamDownload(function () use ($run, $type): void {
            $stream = fopen('php://output', 'wb');
            fputcsv($stream, ['Laporan Penjualan & Analisis Apriori']);
            fputcsv($stream, ['Periode', $run->date_from->format('d-m-Y').' s/d '.$run->date_to->format('d-m-Y')]);
            fputcsv($stream, ['Minimum support', ((float) $run->minimum_support * 100).'%']);
            fputcsv($stream, ['Minimum confidence', ((float) $run->minimum_confidence * 100).'%']);
            fputcsv($stream, ['Minimum lift', $run->minimum_lift]);
            fputcsv($stream, []);

            if ($type === 'itemsets') {
                fputcsv($stream, ['Kombinasi Produk', 'Jumlah Produk', 'Jumlah Transaksi', 'Support']);
                $run->itemsets()->with('items.additionalItem')->orderByDesc('support')->each(function (AprioriItemset $itemset) use ($stream): void {
                    fputcsv($stream, [
                        $itemset->items->pluck('additionalItem.name')->implode(', '),
                        $itemset->item_count,
                        $itemset->support_count,
                        ((float) $itemset->support * 100).'%',
                    ]);
                });
            } else {
                fputcsv($stream, ['Jika Membeli', 'Cenderung Membeli', 'Support', 'Confidence', 'Lift', 'Jumlah Transaksi', 'Interpretasi']);
                $run->rules()->with('items.additionalItem')->orderByDesc('lift')->each(function (AprioriRule $rule) use ($stream): void {
                    [$antecedent, $consequent] = $this->ruleNames($rule);
                    fputcsv($stream, [
                        $antecedent,
                        $consequent,
                        ((float) $rule->support * 100).'%',
                        ((float) $rule->confidence * 100).'%',
                        $rule->lift,
                        $rule->support_count,
                        $this->interpretation($rule, $antecedent, $consequent),
                    ]);
                });
            }

            fclose($stream);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function selectedRun(Request $request): ?AprioriAnalysisRun
    {
        $id = $request->integer('run_id');

        return AprioriAnalysisRun::query()
            ->with('executedBy:id,name')
            ->when($id > 0, fn (Builder $query) => $query->whereKey($id))
            ->when($id <= 0, fn (Builder $query) => $query->latest('executed_at'))
            ->first();
    }

    private function itemsets(Request $request, AprioriAnalysisRun $run)
    {
        return $run->itemsets()
            ->with('items.additionalItem:id,name')
            ->when($request->filled('itemset_search'), fn (Builder $query) => $query->whereHas('items.additionalItem', fn (Builder $items) => $items->where('name', 'like', '%'.$request->string('itemset_search').'%')))
            ->when($request->filled('itemset_size'), fn (Builder $query) => $query->where('item_count', $request->integer('itemset_size')))
            ->when($request->filled('itemset_min_support'), fn (Builder $query) => $query->where('support', '>=', $request->float('itemset_min_support') / 100))
            ->orderByDesc('support')
            ->orderByDesc('support_count')
            ->paginate(10, ['*'], 'itemsets_page')
            ->withQueryString();
    }

    private function rules(Request $request, AprioriAnalysisRun $run)
    {
        $sort = $request->string('rule_sort', $run->sort_by)->toString();
        $sort = in_array($sort, ['support', 'confidence', 'lift'], true) ? $sort : 'lift';

        return $run->rules()
            ->with('items.additionalItem:id,name')
            ->when($request->filled('rule_search'), fn (Builder $query) => $query->whereHas('items.additionalItem', fn (Builder $items) => $items->where('name', 'like', '%'.$request->string('rule_search').'%')))
            ->when($request->filled('rule_min_support'), fn (Builder $query) => $query->where('support', '>=', $request->float('rule_min_support') / 100))
            ->when($request->filled('rule_min_confidence'), fn (Builder $query) => $query->where('confidence', '>=', $request->float('rule_min_confidence') / 100))
            ->when($request->filled('rule_min_lift'), fn (Builder $query) => $query->where('lift', '>=', $request->float('rule_min_lift')))
            ->orderByDesc($sort)
            ->orderByDesc('support_count')
            ->paginate(10, ['*'], 'rules_page')
            ->withQueryString();
    }

    /** @return array{topProducts: mixed, topCombinations: mixed, rules: mixed, insights: array<int, array<string, mixed>>} */
    private function overview(AprioriAnalysisRun $run): array
    {
        $topProducts = $run->itemsets()->with('items.additionalItem:id,name')->where('item_count', 1)->orderByDesc('support_count')->limit(10)->get();
        $topCombinations = $run->itemsets()->with('items.additionalItem:id,name')->where('item_count', '>=', 2)->orderByDesc('support')->limit(10)->get();
        $rules = $run->rules()->with('items.additionalItem:id,name')->orderByDesc('support_count')->orderByDesc('confidence')->orderByDesc('lift')->limit(30)->get();

        return [
            'topProducts' => $topProducts,
            'topCombinations' => $topCombinations,
            'rules' => $rules,
            'insights' => $rules->take(5)->map(function (AprioriRule $rule) use ($run): array {
                [$antecedent, $consequent] = $this->ruleNames($rule);

                return [
                    'id' => $rule->id,
                    'antecedent' => $antecedent,
                    'consequent' => $consequent,
                    'support' => $rule->support,
                    'confidence' => $rule->confidence,
                    'lift' => $rule->lift,
                    'support_count' => $rule->support_count,
                    'limited_data' => $rule->support_count < max(5, $run->minimum_occurrence),
                    'interpretation' => $this->interpretation($rule, $antecedent, $consequent),
                    'recommendation' => 'Pertimbangkan menampilkan '.$consequent.' sebagai rekomendasi saat pelanggan memilih '.$antecedent.'.',
                ];
            })->values()->all(),
        ];
    }

    /** @return array{0: string, 1: string} */
    private function ruleNames(AprioriRule $rule): array
    {
        return [
            $rule->items->where('side', 'antecedent')->pluck('additionalItem.name')->implode(', '),
            $rule->items->where('side', 'consequent')->pluck('additionalItem.name')->implode(', '),
        ];
    }

    private function interpretation(AprioriRule $rule, string $antecedent, string $consequent): string
    {
        return sprintf(
            'Dari transaksi yang membeli %s, %.2f%% juga membeli %s. Kombinasi ini muncul %.2f kali dibandingkan kemungkinan normal.',
            $antecedent,
            (float) $rule->confidence * 100,
            $consequent,
            (float) $rule->lift,
        );
    }
}
