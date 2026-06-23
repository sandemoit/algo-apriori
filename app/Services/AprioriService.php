<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AprioriAnalysisStatus;
use App\Models\AprioriAnalysisRun;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class AprioriService
{
    public function __construct(private readonly AprioriDatasetBuilder $datasetBuilder) {}

    /** @param array<string, int|float|string> $parameters */
    public function createRun(int $userId, array $parameters): AprioriAnalysisRun
    {
        return AprioriAnalysisRun::query()->create([
            'executed_by' => $userId,
            'date_from' => $parameters['date_from'],
            'date_to' => $parameters['date_to'],
            'minimum_support' => $parameters['minimum_support'],
            'minimum_confidence' => $parameters['minimum_confidence'],
            'minimum_lift' => $parameters['minimum_lift'],
            'maximum_itemset' => $parameters['maximum_itemset'],
            'maximum_rules' => $parameters['maximum_rules'],
            'minimum_occurrence' => $parameters['minimum_occurrence'],
            'sort_by' => $parameters['sort_by'],
            'status' => AprioriAnalysisStatus::Pending,
            'executed_at' => now(),
        ]);
    }

    public function shouldQueue(AprioriAnalysisRun $run): bool
    {
        $from = CarbonImmutable::parse($run->date_from);
        $to = CarbonImmutable::parse($run->date_to);

        return $this->datasetBuilder->count($from, $to) > config('apriori.queue_threshold');
    }

    public function execute(AprioriAnalysisRun $run): AprioriAnalysisRun
    {
        $startedAt = now();

        try {
            $run->update([
                'status' => AprioriAnalysisStatus::Processing,
                'started_at' => $startedAt,
                'error_message' => null,
            ]);

            $baskets = $this->datasetBuilder->build(
                CarbonImmutable::parse($run->date_from),
                CarbonImmutable::parse($run->date_to),
            );

            return DB::transaction(function () use ($baskets, $run, $startedAt): AprioriAnalysisRun {
                $run->rules()->delete();
                $run->itemsets()->delete();

                $transactionCount = $baskets->count();
                $frequentItemsets = $this->findFrequentItemsets($baskets, $run);
                $rules = $this->generateRules($frequentItemsets, $transactionCount, $run);

                $this->storeItemsets($run, $frequentItemsets, $transactionCount);
                $this->storeRules($run, $rules);

                $run->update([
                    'transaction_count' => $transactionCount,
                    'unique_item_count' => $baskets->flatten()->unique()->count(),
                    'frequent_itemset_count' => count($frequentItemsets),
                    'rule_count' => count($rules),
                    'execution_time_ms' => $startedAt->diffInMilliseconds(now()),
                    'status' => AprioriAnalysisStatus::Completed,
                    'completed_at' => now(),
                ]);

                return $run->fresh();
            });
        } catch (Throwable $exception) {
            report($exception);

            $run->update([
                'status' => AprioriAnalysisStatus::Failed,
                'error_message' => 'Analisis tidak dapat diselesaikan. Silakan coba lagi.',
                'execution_time_ms' => $startedAt->diffInMilliseconds(now()),
                'completed_at' => now(),
            ]);

            return $run->fresh();
        }
    }

    /** @return array<string, array{items: array<int, int>, support_count: int}> */
    private function findFrequentItemsets(Collection $baskets, AprioriAnalysisRun $run): array
    {
        $transactionCount = $baskets->count();

        if ($transactionCount === 0) {
            return [];
        }

        $singleCounts = [];
        foreach ($baskets as $basket) {
            foreach ($basket as $itemId) {
                $singleCounts[$itemId] = ($singleCounts[$itemId] ?? 0) + 1;
            }
        }

        $currentLevel = [];
        foreach ($singleCounts as $itemId => $supportCount) {
            $items = [(int) $itemId];
            if ($this->meetsThreshold($supportCount, $transactionCount, $run)) {
                $currentLevel[$this->itemsetKey($items)] = ['items' => $items, 'support_count' => $supportCount];
            }
        }

        $frequentItemsets = $currentLevel;
        for ($size = 2; $size <= $run->maximum_itemset && $currentLevel !== []; $size++) {
            $candidates = $this->generateCandidates($currentLevel, $size);
            $nextLevel = [];

            foreach ($candidates as $candidate) {
                $supportCount = $this->countContainingBaskets($baskets, $candidate);
                if (! $this->meetsThreshold($supportCount, $transactionCount, $run)) {
                    continue;
                }

                $nextLevel[$this->itemsetKey($candidate)] = [
                    'items' => $candidate,
                    'support_count' => $supportCount,
                ];
            }

            $frequentItemsets += $nextLevel;
            $currentLevel = $nextLevel;
        }

        return $frequentItemsets;
    }

    /** @param array<string, array{items: array<int, int>, support_count: int}> $level
     * @return array<int, array<int, int>> */
    private function generateCandidates(array $level, int $size): array
    {
        $previous = array_values($level);
        $candidateMap = [];

        foreach ($previous as $leftIndex => $left) {
            foreach (array_slice($previous, $leftIndex + 1) as $right) {
                $candidate = array_values(array_unique([...$left['items'], ...$right['items']]));
                sort($candidate);
                if (count($candidate) !== $size || ! $this->hasFrequentSubsets($candidate, $level)) {
                    continue;
                }

                $candidateMap[$this->itemsetKey($candidate)] = $candidate;
            }
        }

        return array_values($candidateMap);
    }

    /** @param array<int, int> $candidate
     * @param array<string, array{items: array<int, int>, support_count: int}> $level */
    private function hasFrequentSubsets(array $candidate, array $level): bool
    {
        foreach ($candidate as $index => $unused) {
            $subset = $candidate;
            unset($subset[$index]);
            if (! isset($level[$this->itemsetKey(array_values($subset))])) {
                return false;
            }
        }

        return true;
    }

    /** @param array<string, array{items: array<int, int>, support_count: int}> $itemsets
     * @return array<int, array{antecedent: array<int, int>, consequent: array<int, int>, support: float, confidence: float, lift: float, support_count: int}> */
    private function generateRules(array $itemsets, int $transactionCount, AprioriAnalysisRun $run): array
    {
        if ($transactionCount === 0) {
            return [];
        }

        $rules = [];
        foreach ($itemsets as $itemset) {
            if (count($itemset['items']) < 2) {
                continue;
            }

            foreach ($this->properSubsets($itemset['items']) as $antecedent) {
                $consequent = array_values(array_diff($itemset['items'], $antecedent));
                $antecedentData = $itemsets[$this->itemsetKey($antecedent)] ?? null;
                $consequentData = $itemsets[$this->itemsetKey($consequent)] ?? null;
                if ($antecedentData === null || $consequentData === null) {
                    continue;
                }

                $support = $itemset['support_count'] / $transactionCount;
                $confidence = $itemset['support_count'] / $antecedentData['support_count'];
                $lift = $confidence / ($consequentData['support_count'] / $transactionCount);
                if ($confidence < (float) $run->minimum_confidence || $lift < (float) $run->minimum_lift) {
                    continue;
                }

                $rules[] = compact('antecedent', 'consequent', 'support', 'confidence', 'lift') + [
                    'support_count' => $itemset['support_count'],
                ];
            }
        }

        usort($rules, fn (array $left, array $right): int => $this->compareRules($left, $right, $run->sort_by));

        return array_slice($rules, 0, $run->maximum_rules);
    }

    /** @param array<int, int> $items
     * @return array<int, array<int, int>> */
    private function properSubsets(array $items): array
    {
        $subsets = [];
        $limit = (1 << count($items)) - 1;
        for ($mask = 1; $mask < $limit; $mask++) {
            $subset = [];
            foreach ($items as $index => $itemId) {
                if (($mask & (1 << $index)) !== 0) {
                    $subset[] = $itemId;
                }
            }
            $subsets[] = $subset;
        }

        return $subsets;
    }

    /** @param array<int, array{antecedent: array<int, int>, consequent: array<int, int>, support: float, confidence: float, lift: float, support_count: int}> $rules */
    private function storeRules(AprioriAnalysisRun $run, array $rules): void
    {
        foreach ($rules as $data) {
            $rule = $run->rules()->create(Arr::only($data, ['support', 'confidence', 'lift', 'support_count']));
            $rule->items()->createMany([
                ...array_map(fn (int $itemId): array => ['additional_item_id' => $itemId, 'side' => 'antecedent'], $data['antecedent']),
                ...array_map(fn (int $itemId): array => ['additional_item_id' => $itemId, 'side' => 'consequent'], $data['consequent']),
            ]);
        }
    }

    /** @param array<string, array{items: array<int, int>, support_count: int}> $itemsets */
    private function storeItemsets(AprioriAnalysisRun $run, array $itemsets, int $transactionCount): void
    {
        foreach ($itemsets as $itemset) {
            $record = $run->itemsets()->create([
                'item_count' => count($itemset['items']),
                'support_count' => $itemset['support_count'],
                'support' => $itemset['support_count'] / $transactionCount,
            ]);
            $record->items()->createMany(array_map(
                fn (int $itemId): array => ['additional_item_id' => $itemId],
                $itemset['items'],
            ));
        }
    }

    /** @param array<int, int> $candidate */
    private function countContainingBaskets(Collection $baskets, array $candidate): int
    {
        return $baskets->filter(
            fn (array $basket): bool => array_diff($candidate, $basket) === [],
        )->count();
    }

    private function meetsThreshold(int $supportCount, int $transactionCount, AprioriAnalysisRun $run): bool
    {
        return $supportCount >= $run->minimum_occurrence
            && ($supportCount / $transactionCount) >= (float) $run->minimum_support;
    }

    /** @param array<int, int> $items */
    private function itemsetKey(array $items): string
    {
        sort($items);

        return implode(':', $items);
    }

    /** @param array{support: float, confidence: float, lift: float, support_count: int} $left
     * @param array{support: float, confidence: float, lift: float, support_count: int} $right */
    private function compareRules(array $left, array $right, string $sortBy): int
    {
        $metric = in_array($sortBy, ['support', 'confidence', 'lift'], true) ? $sortBy : 'lift';

        return $right[$metric] <=> $left[$metric]
            ?: $right['support_count'] <=> $left['support_count'];
    }
}
