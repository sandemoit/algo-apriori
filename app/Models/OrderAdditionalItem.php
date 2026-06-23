<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderAdditionalItem extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['configuration' => 'array', 'unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];
    }
}
