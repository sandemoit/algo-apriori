<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdditionalItem extends Model
{
    protected $fillable = ['code', 'name', 'price', 'unit', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['price' => 'decimal:2', 'is_active' => 'boolean'];
    }
}
