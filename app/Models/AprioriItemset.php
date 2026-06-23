<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AprioriItemset extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['support' => 'decimal:6'];
    }

    public function analysisRun(): BelongsTo
    {
        return $this->belongsTo(AprioriAnalysisRun::class, 'analysis_run_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AprioriItemsetItem::class);
    }
}
