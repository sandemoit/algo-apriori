<?php

declare(strict_types=1);

namespace App\Enums;

enum FulfillmentMethod: string
{
    case Pickup = 'pickup';
    case Delivery = 'delivery';

    public function label(): string
    {
        return match ($this) {
            self::Pickup => 'Ambil di toko',
            self::Delivery => 'Delivery / COD',
        };
    }

    public function requiresAddress(): bool
    {
        return $this !== self::Pickup;
    }
}
