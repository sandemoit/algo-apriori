<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderSubmissionToken extends Model
{
    protected $fillable = ['token', 'order_id'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
