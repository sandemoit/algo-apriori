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
            ->when($request->filled('search'), fn (Builder $orders) => $this->search($orders, $request->string('search')->toString()))
            ->when($request->filled('status'), fn (Builder $orders) => $orders->where('status', $request->string('status')->toString()))
            ->when($request->filled('ordered_from'), fn (Builder $orders) => $orders->whereDate('ordered_at', '>=', $request->date('ordered_from')))
            ->when($request->filled('ordered_to'), fn (Builder $orders) => $orders->whereDate('ordered_at', '<=', $request->date('ordered_to')))
            ->when($request->filled('pickup_from'), fn (Builder $orders) => $orders->whereDate('fulfillment_at', '>=', $request->date('pickup_from')))
            ->when($request->filled('pickup_to'), fn (Builder $orders) => $orders->whereDate('fulfillment_at', '<=', $request->date('pickup_to')));

        $today = now()->toDateString();
        $todayQuery = Order::query()->whereDate('ordered_at', $today);

        return Inertia::render('admin/orders', [
            'orders' => $query->latest('fulfillment_at')->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'status', 'ordered_from', 'ordered_to', 'pickup_from', 'pickup_to']),
            'summary' => ['total' => (clone $todayQuery)->count(), 'completed' => (clone $todayQuery)->where('status', OrderStatus::Completed)->count(), 'pending' => (clone $todayQuery)->where('status', OrderStatus::Pending)->count()],
        ]);
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
