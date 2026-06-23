<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class AprioriDatasetBuilder
{
    /** @return Collection<int, array<int, int>> */
    public function build(CarbonInterface $from, CarbonInterface $to): Collection
    {
        return $this->eligibleOrders($from, $to)
            ->get(['id'])
            ->map(fn (Order $order): array => $order->additionalItems
                ->pluck('additional_item_id')
                ->unique()
                ->sort()
                ->values()
                ->map(fn (mixed $id): int => (int) $id)
                ->all())
            ->filter(fn (array $basket): bool => $basket !== [])
            ->values();
    }

    public function count(CarbonInterface $from, CarbonInterface $to): int
    {
        return $this->eligibleOrders($from, $to)->count();
    }

    private function eligibleOrders(CarbonInterface $from, CarbonInterface $to)
    {
        return Order::query()
            ->where('status', OrderStatus::Completed)
            ->where('payment_status', PaymentStatus::Paid)
            ->whereBetween('fulfillment_at', [$from->startOfDay(), $to->endOfDay()])
            ->whereHas('additionalItems')
            ->with('additionalItems:id,order_id,additional_item_id');
    }
}
