<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderIndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $query = Order::query()
            ->tap(fn (Builder $orders) => $this->applySharedFilters($orders, $request))
            ->when($request->filled('status'), fn (Builder $orders) => $orders->where('status', $request->string('status')->toString()))
            ->tap(fn (Builder $orders) => $this->applyPickupFilters($orders, $request));

        $today = now()->toDateString();
        $summaryOrders = Order::query()
            ->tap(fn (Builder $orders) => $this->applySharedFilters($orders, $request))
            ->tap(fn (Builder $orders) => $this->applySummaryDateScope($orders, $request, 'ordered_at', 'fulfillment_at', $today));

        $summaryCompleted = Order::query()
            ->where('status', OrderStatus::Completed)
            ->tap(fn (Builder $orders) => $this->applySharedFilters($orders, $request))
            ->tap(fn (Builder $orders) => $this->applySummaryDateScope($orders, $request, 'completed_at', 'completed_at', $today));

        return Inertia::render('admin/orders', [
            'orders' => $query->latest('fulfillment_at')->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'status', 'ordered_from', 'ordered_to', 'pickup_from', 'pickup_to']),
            'summary' => ['total' => (clone $summaryOrders)->count(), 'completed' => $summaryCompleted->count(), 'pending' => (clone $summaryOrders)->where('status', OrderStatus::Pending)->count()],
        ]);
    }

    private function applySharedFilters(Builder $orders, Request $request): void
    {
        $orders
            ->when($request->filled('search'), fn (Builder $query) => $this->search($query, $request->string('search')->toString()))
            ->when($request->filled('ordered_from'), fn (Builder $query) => $query->whereDate('ordered_at', '>=', $request->date('ordered_from')))
            ->when($request->filled('ordered_to'), fn (Builder $query) => $query->whereDate('ordered_at', '<=', $request->date('ordered_to')));
    }

    private function applyPickupFilters(Builder $orders, Request $request): void
    {
        $orders
            ->when($request->filled('pickup_from'), fn (Builder $query) => $query->whereDate('fulfillment_at', '>=', $request->date('pickup_from')))
            ->when($request->filled('pickup_to'), fn (Builder $query) => $query->whereDate('fulfillment_at', '<=', $request->date('pickup_to')));
    }

    private function applySummaryDateScope(
        Builder $orders,
        Request $request,
        string $defaultDateColumn,
        string $pickupFilterDateColumn,
        string $defaultDate,
    ): void {
        if ($request->filled('ordered_from') || $request->filled('ordered_to')) {
            return;
        }

        if ($request->filled('pickup_from') || $request->filled('pickup_to')) {
            $orders
                ->when($request->filled('pickup_from'), fn (Builder $query) => $query->whereDate($pickupFilterDateColumn, '>=', $request->date('pickup_from')))
                ->when($request->filled('pickup_to'), fn (Builder $query) => $query->whereDate($pickupFilterDateColumn, '<=', $request->date('pickup_to')));

            return;
        }

        $orders->whereDate($defaultDateColumn, $defaultDate);
    }

    private function search(Builder $orders, string $value): void
    {
        $search = '%'.$value.'%';
        $orders->where(fn (Builder $query) => $query
            ->where('order_number', 'like', $search)
            ->orWhere('customer_name_snapshot', 'like', $search)
            ->orWhere('customer_phone_snapshot', 'like', $search));
    }
}
