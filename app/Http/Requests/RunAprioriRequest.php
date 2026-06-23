<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RunAprioriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'date_from' => ['required', 'date', 'before_or_equal:date_to'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'minimum_support' => ['required', 'numeric', 'between:0.01,100'],
            'minimum_confidence' => ['required', 'numeric', 'between:0.01,100'],
            'minimum_lift' => ['nullable', 'numeric', 'between:0,100'],
            'maximum_itemset' => ['nullable', 'integer', 'between:2,4'],
            'maximum_rules' => ['nullable', 'integer', 'between:1,'.config('apriori.maximum_rules')],
            'minimum_occurrence' => ['nullable', 'integer', 'between:1,10000'],
            'sort_by' => ['nullable', Rule::in(['support', 'confidence', 'lift'])],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $dateFrom = CarbonImmutable::parse($this->input('date_from'));
                $dateTo = CarbonImmutable::parse($this->input('date_to'));
                $maximumDays = (int) config('apriori.maximum_date_range_days');

                if ($dateFrom->diffInDays($dateTo) > $maximumDays) {
                    $validator->errors()->add(
                        'date_to',
                        "Periode analisis maksimal {$maximumDays} hari.",
                    );
                }
            },
        ];
    }

    /** @return array<string, int|float|string> */
    public function analysisParameters(): array
    {
        $validated = $this->validated();

        return [
            'date_from' => $validated['date_from'],
            'date_to' => $validated['date_to'],
            'minimum_support' => (float) $validated['minimum_support'] / 100,
            'minimum_confidence' => (float) $validated['minimum_confidence'] / 100,
            'minimum_lift' => (float) ($validated['minimum_lift'] ?? config('apriori.default_minimum_lift')),
            'maximum_itemset' => (int) ($validated['maximum_itemset'] ?? config('apriori.default_maximum_itemset')),
            'maximum_rules' => (int) ($validated['maximum_rules'] ?? config('apriori.default_maximum_rules')),
            'minimum_occurrence' => (int) ($validated['minimum_occurrence'] ?? config('apriori.default_minimum_occurrence')),
            'sort_by' => (string) ($validated['sort_by'] ?? 'lift'),
        ];
    }
}
