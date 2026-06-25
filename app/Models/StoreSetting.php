<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $guarded = [];

    /** @return array<string, mixed> */
    public static function defaults(): array
    {
        return [
            'store_name' => 'Kue Bahagia',
            'store_phone' => '',
            'admin_whatsapp' => '',
            'store_address' => '',
            'logo_path' => null,
            'customer_order_template' => 'Pesanan {order_number} berhasil dibuat.',
            'admin_order_template' => 'Pesanan baru {order_number}.',
            'public_order_enabled' => true,
            'minimum_pickup_days' => 1,
            'opening_time' => '08:00',
            'closing_time' => '20:00',
            'delivery_fee' => 0,
        ];
    }

    protected function casts(): array
    {
        return [
            'public_order_enabled' => 'boolean',
            'delivery_fee' => 'decimal:2',
        ];
    }
}
