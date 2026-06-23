<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AprioriAnalysisStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AprioriAnalysisRun extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'executed_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'status' => AprioriAnalysisStatus::class,
            'minimum_support' => 'decimal:6',
            'minimum_confidence' => 'decimal:6',
            'minimum_lift' => 'decimal:6',
        ];
    }

    public function executedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executed_by');
    }

    public function rules(): HasMany
    {
        return $this->hasMany(AprioriRule::class, 'analysis_run_id');
    }

    public function itemsets(): HasMany
    {
        return $this->hasMany(AprioriItemset::class, 'analysis_run_id');
    }
}
