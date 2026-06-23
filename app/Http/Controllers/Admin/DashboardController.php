<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = today();

        return Inertia::render('dashboard', [
            'metrics' => ['orders_today' => Order::query()->whereDate('ordered_at', $today)->count(), 'pickup_today' => Order::query()->whereDate('fulfillment_at', $today)->count(), 'completed_today' => Order::query()->where('status', OrderStatus::Completed)->whereDate('completed_at', $today)->count(), 'pending_orders' => Order::query()->where('status', OrderStatus::Pending)->count(), 'revenue' => Order::query()->where('status', OrderStatus::Completed)->sum('grand_total')],
            'latestOrders' => Order::query()->with('whatsappLogs:id,order_id,recipient_type,status')->latest('ordered_at')->limit(6)->get(),
            'upcomingOrders' => Order::query()->where('status', OrderStatus::Pending)->where('fulfillment_at', '>=', now())->orderBy('fulfillment_at')->limit(6)->get(['id', 'order_number', 'customer_name_snapshot', 'fulfillment_at', 'grand_total', 'status']),
            'popularItems' => DB::table('order_additional_items')->join('additional_items', 'additional_items.id', '=', 'order_additional_items.additional_item_id')->select('additional_items.name', DB::raw('sum(order_additional_items.quantity) as total'))->groupBy('additional_items.id', 'additional_items.name')->orderByDesc('total')->limit(5)->get(),
        ]);
    }
}
